const d3 = require('d3');
const _ = require('lodash');
const fs = require('fs');

const HEADERS = 'CMTE_ID|AMNDT_IND|RPT_TP|TRANSACTION_PGI|IMAGE_NUM|TRANSACTION_TP|ENTITY_TP|NAME|CITY|STATE|ZIP_CODE|EMPLOYER|OCCUPATION|TRANSACTION_DT|TRANSACTION_AMT|OTHER_ID|TRAN_ID|FILE_NUM|MEMO_CD|MEMO_TEXT|SUB_ID';

/**
 * Asynchronously reads input file with node
 * @param {string} path
 */
async function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

/**
 * Parses lines into JSON objects
 * @param {string} input
 */
async function parseInput(input) {
  return new Promise((resolve, reject) => {
    try {
      const psv = d3.dsvFormat('|');
      resolve(psv.parse(`${HEADERS}\n${input}`));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Calculates the running median for each donated contribution.
 * @param {array} donations - Batch array of contributions
 */
function calcMediansByZip(donations) {
  const zipCodeDonationMap = {}; // Create object to store seen zip codes
  const runningMedianOutput = [];
  for (const donation of donations) {
    const { ZIP_CODE, TRANSACTION_AMT, CMTE_ID } = donation;
    const currentZipCode = zipCodeDonationMap[ZIP_CODE];
    if (currentZipCode) { // If the zip exists add the donation to this array
      currentZipCode.push(TRANSACTION_AMT);
    } else { // Or else create the array in zip code object
      zipCodeDonationMap[ZIP_CODE] = [TRANSACTION_AMT];
    }
    // Calculate this donation's zip code's current median, sum, and size
    // Pipe deliminate the values
    const activeDonationGroup = zipCodeDonationMap[ZIP_CODE];
    const median = Math.round(d3.median(activeDonationGroup));
    const sum = d3.sum(activeDonationGroup);
    const output = [CMTE_ID, ZIP_CODE, median, activeDonationGroup.length, sum].join('|');
    runningMedianOutput.push(output);
  }
  // return this batch for writing to file
  return runningMedianOutput.join('\n');
}

/**
 * Calculates the daily median for each candidate.
 * @param {array} donations - Array of contributions
 */
function calcMediansByDate(donations) {
  // Donations are nested by their candidate and then their date.
  const donationsNest = d3.nest()
    .key(d => d.CMTE_ID).sortKeys(d3.ascending) // eslint-disable-line newline-per-chained-call
    .key(d => d.PARSED_DATE).sortKeys(d3.ascending) // eslint-disable-line newline-per-chained-call
    .entries(donations);
  const results = [];
  // Iterate for each candidate
  for (const recipientGroup of donationsNest) {
    const id = recipientGroup.key;
    // Then for each date to return an list of donations
    for (const dateGroup of recipientGroup.values) {
      // Calculate the median, sum, and size for this day
      const date = dateGroup.values[0].TRANSACTION_DT;
      const contributionAmounts = dateGroup.values.map(d => d.TRANSACTION_AMT);
      const median = Math.round(d3.median(contributionAmounts));
      const sum = d3.sum(contributionAmounts);
      const output = [id, date, median, contributionAmounts.length, sum].join('|');
      results.push(output);
    }
  }
  // return formatted lines for writing to file
  return results.join('\n');
}

/**
 * Asynchronously writes file with node
 * @param {string} path
 * @param {string} data
 */
async function writeFile(path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

/**
 * Runs pipeline
 */
async function main() {
  const hrstart = process.hrtime(); // Start timing program
  // Get arguments from command line
  const [nodeLib, projectLib, inputPath, mediansByZipPath, mediansByDatePath] = process.argv;

  // Open input file, and parse donations into JSON objects
  const file = await readFile(inputPath);
  const data = await parseInput(file);

  // Remove Prototype from object leaving only contributions
  const donations = data.map(d => d);

  // Shorten Zip to 5 digits
  _.each(donations, (d) => {
    d.ZIP_CODE = d.ZIP_CODE.slice(0, 5); // eslint-disable-line no-param-reassign
  });

  // Parse dates to unix epoch time values
  _.each(donations, (d) => {
    const formatter = d3.timeParse('%m%d%Y');
    d.PARSED_DATE = null; // eslint-disable-line no-param-reassign
    // Skip missing dates for mediansByDate file
    if (d.TRANSACTION_DT.length === 8) d.PARSED_DATE = formatter(d.TRANSACTION_DT).valueOf(); // eslint-disable-line no-param-reassign
  });

  // Skip missing donations with missing recipients, amounts and if they are not individual donations
  const summable = _.filter(donations, d => d.CMTE_ID && d.TRANSACTION_AMT && !d.OTHER_ID);
  // Also skip missing dates for mediansByDate file
  const dateable = _.filter(summable, d => !_.isNull(d.PARSED_DATE));

  // Calculate medians by zip and write to file
  const byZip = calcMediansByZip(summable);
  const promise1 = writeFile(mediansByZipPath, byZip);

  // Calculate medians by date and write to file
  const byDate = calcMediansByDate(dateable);
  const promise2 = writeFile(mediansByDatePath, byDate);

  // Stop timing program and return when finished using IO
  const hrend = process.hrtime(hrstart);
  Promise.all([promise1, promise2]).then(console.log('Finished writing files =) | Execution time: %ds %dms', hrend[0], hrend[1] / 1000000));
}
main().catch((error) => { console.error(error); });

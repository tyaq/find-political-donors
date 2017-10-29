const d3 = require('d3');
const _ = require('lodash');
const fs = require('fs');

const HEADERS = 'CMTE_ID|AMNDT_IND|RPT_TP|TRANSACTION_PGI|IMAGE_NUM|TRANSACTION_TP|ENTITY_TP|NAME|CITY|STATE|ZIP_CODE|EMPLOYER|OCCUPATION|TRANSACTION_DT|TRANSACTION_AMT|OTHER_ID|TRAN_ID|FILE_NUM|MEMO_CD|MEMO_TEXT|SUB_ID';

async function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

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
 * Stream
 * @param {*} donations
 */
function calcMediansByZip(donations) {
  const zipCodeDonationMap = {};
  const runningMedianOutput = [];
  for (const donation of donations) {
    const { ZIP_CODE, TRANSACTION_AMT, CMTE_ID } = donation;
    const currentZipCode = zipCodeDonationMap[ZIP_CODE];
    if (currentZipCode) {
      currentZipCode.push(TRANSACTION_AMT);
    } else {
      zipCodeDonationMap[ZIP_CODE] = [TRANSACTION_AMT];
    }
    const activeDonationGroup = zipCodeDonationMap[ZIP_CODE];
    const median = Math.round(d3.median(activeDonationGroup));
    const sum = d3.sum(activeDonationGroup);
    const output = [CMTE_ID, ZIP_CODE, median, activeDonationGroup.length, sum].join('|');
    runningMedianOutput.push(output);
  }
  return runningMedianOutput.join('\n');
}

function calcMediansByDate(donations) {
  const donationsNest = d3.nest()
    .key(d => d.CMTE_ID).sortKeys(d3.ascending) // eslint-disable-line newline-per-chained-call
    .key(d => d.PARSED_DATE).sortKeys(d3.ascending) // eslint-disable-line newline-per-chained-call
    .entries(donations);
  const results = [];
  for (const recipientGroup of donationsNest) {
    const id = recipientGroup.key;
    for (const dateGroup of recipientGroup.values) {
      const date = dateGroup.values[0].TRANSACTION_DT;
      const contributionAmounts = dateGroup.values.map(d => d.TRANSACTION_AMT);
      const median = Math.round(d3.median(contributionAmounts));
      const sum = d3.sum(contributionAmounts);
      const output = [id, date, median, contributionAmounts.length, sum].join('|');
      results.push(output);
    }
  }
  return results.join('\n');
}

async function writeFile(path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

async function main() {
  const [nodeLib, projectLib, inputPath, mediansByZipPath, mediansByDatePath] = process.argv;

  const file = await readFile(inputPath);
  const data = await parseInput(file);

  // Remove Prototype
  const donations = data.map(d => d);
  // Shorten Zip
  _.each(donations, (d) => {
    d.ZIP_CODE = d.ZIP_CODE.slice(0, 5); // eslint-disable-line no-param-reassign
  });
  _.each(donations, (d) => {
    const formatter = d3.timeParse('%m%d%Y');
    d.PARSED_DATE = null; // eslint-disable-line no-param-reassign
    // Skip missing dates
    if (d.TRANSACTION_DT.length === 8) d.PARSED_DATE = formatter(d.TRANSACTION_DT); // eslint-disable-line no-param-reassign
  });
  const summable = _.filter(donations, d => d.CMTE_ID && d.TRANSACTION_AMT && !d.OTHER_ID);
  const dateable = _.filter(summable, d => _.isDate(d.PARSED_DATE));
  const byZip = calcMediansByZip(summable);
  const promise1 = writeFile(mediansByZipPath, byZip);
  const byDate = calcMediansByDate(dateable);
  const promise2 = writeFile(mediansByDatePath, byDate);
  Promise.all([promise1, promise2]).then(console.log('Finished writing files =)'));
}
main().catch((error) => { console.error(error); });

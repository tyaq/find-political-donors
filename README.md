# Overview

# Requirements
[Python 2.7.X](https://www.python.org/downloads/)

# Running the Pipeline
1) Install the latest version Python 2.7, if necessary
2) Clone this repository
```Bash
git clone this-repo-url
```
3) Run the shell script `run.sh`
```Bash
./run.sh
```

# Project Requirements
## General
-[x] (run_tests.sh) Use directory Structure
-[] Make sure tests work
-[] Make my own tests
-[] identify the areas (zip codes) that may be fertile ground for soliciting future donations for similar candidates
-[] Because those donations may come from specific events (e.g., high-dollar fundraising dinners), you also want to identify which time periods are particularly lucrative so that an analyst might later correlate them to specific fundraising events.
## File structure
-[] `medianvals_by_zip.txt`: contains a calculated running median, total dollar amount and total number of contributions by recipient and zip code
-[] `medianvals_by_date.txt`: has the calculated median, total dollar amount and total number of contributions by recipient and date.
-[] process each line of the input file as if that record was sequentially streaming into your program(Generator)
-[] For each input file line, calculate the running median of contributions, total number of transactions and total amount of contributions streaming in so far for that recipient and zip code.
-[] calculated fields should then be formatted into a pipe-delimited line and written to an output file named `medianvals_by_zip.txt` in the same order as the input line appeared in the input file
-[] write to a second output file named `medianvals_by_date.txt`. Each line of this second output file should list every unique combination of date and recipient from the input file and then the calculated total contributions and median contribution for that combination of date and recipient
-[] fields on each pipe-delimited line of `medianvals_by_date.txt` should be date, recipient, total number of transactions, total amount of contributions and median contribution
-[] unlike the first output file, every line in the `medianvals_by_date.txt` file should be represented by a unique combination of day and recipient -- there should be no duplicates

The Federal Election Commission provides data files stretching back years and is [regularly updated](http://classic.fec.gov/finance/disclosure/ftpdet.shtml)

For the purposes of this challenge, we’re interested in individual contributions. While you're welcome to run your program using the data files found at the FEC's website, you should not assume that we'll be testing your program on any of those data files or that the lines will be in the same order as what can be found in those files. Our test data files, however, will conform to the data dictionary [as described by the FEC](http://classic.fec.gov/finance/disclosure/metadata/DataDictionaryContributionsbyIndividuals.shtml).

Also, while there are many fields in the file that may be interesting, below are the ones that you’ll need to complete this challenge:

* `CMTE_ID`: identifies the flier, which for our purposes is the recipient of this contribution
* `ZIP_CODE`:  zip code of the contributor (we only want the first five digits/characters)
* `TRANSACTION_DT`: date of the transaction
* `TRANSACTION_AMT`: amount of the transaction
* `OTHER_ID`: a field that denotes whether contribution came from a person or an entity 

## Input Edge Cases
-[] only want records that have the field, `OTHER_ID`, set to empty. If the `OTHER_ID` field contains any other value, ignore the entire record and don't include it in any calculation
-[] If `TRANSACTION_DT` is an invalid date (e.g., empty, malformed), you should still take the record into consideration when outputting the results of `medianvals_by_zip.txt` but completely ignore the record when calculating values for `medianvals_by_date.txt`
-[] While the data dictionary has the `ZIP_CODE` occupying nine characters, for the purposes of the challenge, we only consider the first five characters of the field as the zip code
-[] If `ZIP_CODE` is an invalid zipcode (i.e., empty, fewer than five digits), you should still take the record into consideration when outputting the results of `medianvals_by_date.txt` but completely ignore the record when calculating values for `medianvals_by_zip.txt`
-[] If any lines in the input file contains empty cells in the `CMTE_ID` or `TRANSACTION_AMT` fields, you should ignore and skip the record and not take it into consideration when making any calculations for the output files
-[] Except for the considerations noted above with respect to `CMTE_ID`, `ZIP_CODE`, `TRANSACTION_DT`, `TRANSACTION_AMT`, `OTHER_ID`, data in any of the other fields (whether the data is valid, malformed, or empty) should not affect your processing. That is, as long as the four previously noted considerations apply, you should process the record as if it was a valid, newly arriving transaction. (For instance, campaigns sometimes retransmit transactions as amendments, however, for the purposes of this challenge, you can ignore that distinction and treat all of the lines as if they were new)
-[] The transactions noted in the input file are not in any particular order, and in fact, can be out of order chronologically
# Political Donations Pipeline
This is a pipeline to parse [FEC filed](http://classic.fec.gov/finance/disclosure/ftpdet.shtml) contributions. It outputs the contributions grouped by zip code and date.

## Overview
Donations in the [FEC format](http://classic.fec.gov/finance/disclosure/metadata/DataDictionaryContributionsbyIndividuals.shtml) are read from `input/itcont.txt` as JSON objects. After filtering for missing fields, `medianvals_by_zip.txt` is written by storing and updating a list keyed by zip codes with donations.  A running median is calculated from this list. `medianvals_by_date.txt` is written by nesting donations by candidate filing numbers. Within the filing numbers donations are nested by date with the oldest date first. This structuring is then used to calculate medians. The written file is this structure flattened.


## Requirements
Most Current [Node.js (8+)](https://nodejs.org/en/download/package-manager/)

Node Package Manager (NPM) 

## Installation
1) Install the latest version [Node.js](https://nodejs.org/en/download/current/), if necessary. Please note NPM is included in this installation.

2) Clone this repository.
```Bash
git clone https://github.com/tyaq/find-political-donors.git
```
3) Navigate to `src` directory and install dependencies.
```Bash
cd src
npm install
cd ../
```

## Running the Pipeline
1) Change permissions of `run.sh` to allow execution.
```Bash
chmod +x ./run.sh
```

2) Run the shell script `run.sh`.
```Bash
./run.sh
```
This just executes,
```Bash
node ./src/index.js ./input/itcont.txt ./output/medianvals_by_zip.txt ./output/medianvals_by_date.txt
```
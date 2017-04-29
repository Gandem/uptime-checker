const http = require('http');
const readline = require('readline');
const fs = require('fs');

const lineReader = readline.createInterface({
  input: fs.createReadStream('top-1m.csv'),
});

const [firstLine = 1, lastLine] = process.argv.slice(2, 4).map(Number);

let i = 1;
lineReader.on('line', lineLog);

function lineLog(line) {
  if (i > firstLine - 1) {
    const url = line.split(',')[1];
    const startDate = Date.now();
    http
      .get('http://' + url, res => {
        console.log(url, res.statusCode, Date.now() - startDate);
      })
      .on('error', e => {
        console.error(`Got error: ${e.message} ${url}`);
      });
  }
  i++;
  if (i === lastLine + 1) lineReader.removeListener('line', lineLog);
}


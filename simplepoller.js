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
    const hostname = line.split(',')[1];
    const startDate = Date.now();
    http
      .get(
        {
          hostname,
          headers: {
            'User-Agent': 'WebsitePoller/1.0',
            Accept: '*/*',
            'Cache-control': 'no-cache',
            Connection: 'keep-alive',
          },
        },
        res => {
          console.log(hostname, res.statusCode, Date.now() - startDate);
        }
      )
      .on('error', e => {
        console.error(
          `Got error: ${e.message} ${hostname} ${Date.now() - startDate}`
        );
      });
  }
  i++;
  if (i === lastLine + 1) lineReader.removeListener('line', lineLog);
}


import http from 'http';
import fs from 'fs';

const MAPPINGS_PATH = '../mappings.json';
let DNS_MAPPINGS = require(MAPPINGS_PATH);

fs.watchFile(MAPPINGS_PATH, () => {
  console.log('Reloading DNS mappings');
  DNS_MAPPINGS = require(MAPPINGS_PATH);
});

Object.keys(DNS_MAPPINGS).forEach((key) => {
  const address = DNS_MAPPINGS[key];
  download(address)
    .then(() => {
      console.log(`Successfully pre-loaded ${key}`);
    })
    .catch(err => {
      console.log(`Error pre-loading ${key}: ${err}`);
    });
});

const server = http.createServer((req, res) => {
  const ipfsAddress = DNS_MAPPINGS[req.headers.host];
  if (!ipfsAddress) {
    res.writeHead(404, {
      'Content-Type': 'text/plain',
    });
    res.end(`No mapping specified for host ${req.headers.host}`);
  }
  download(ipfsAddress)
    .then((data: string) => {
      res.writeHead(200, {
        'Content-Type': 'text/html',
      });
      res.end(data);
    })
    .catch(err => {
      res.writeHead(500);
      res.end('Error retrieving ipfs data' + err);
    });
});

server.listen(3000, () => {
  console.log('http server listening on port 3000');
});

function download(ipfsAddress: string) {
  return new Promise((rs, rj) => {
    let rawData = '';
    http.get(`http://localhost:8080/ipfs/${ipfsAddress}`, (res) => {
      if (res.statusCode !== 200) {
        rj(new Error(`Request failed with status code: ${res.statusCode}`));
        return;
      }
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        rs(rawData);
      });
    });
  });
}

import http from 'http';

const dnsMappings: {
  [key: string]: string
} = {
  'commontheory.io': 'QmNutHj5GWqsv6a4gpdUZLFeLRb7i6U2icTBSYyzdJfoch',
  'localhost:3000': 'QmNutHj5GWqsv6a4gpdUZLFeLRb7i6U2icTBSYyzdJfoch',
};

Object.keys(dnsMappings).forEach((key) => {
  const address = dnsMappings[key];
  download(address)
    .then(() => {
      console.log(`Successfully pre-loaded ${key}`);
    })
    .catch(err => {
      console.log(`Error pre-loading ${key}: ${err}`);
    });
});

const server = http.createServer((req, res) => {
  const ipfsAddress = dnsMappings[req.headers.host];
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
    http.get(`http://localhost:5001/api/v0/get?arg=${ipfsAddress}`, (res) => {
      if (res.statusCode !== 200) {
        rj(new Error(`Request failed with status code: ${res.statusCode}`));
        return;
      }
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        // For some reason the IPFS http api prefixes the responses
        const identifier = ' 00                                                                0000000 0000000';
        const start = rawData.indexOf(identifier);
        rs(rawData.slice(start + identifier.length));
      });
    });
  });
}

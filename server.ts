import http from 'http';
import fs from 'fs';
import path from 'path';

const MAPPINGS_PATH = path.resolve(__dirname, '../mappings.json');
let DNS_MAPPINGS: {
  [key: string]: string
} = {};
loadMappings()
  .then(async (mappings: any) => {
    DNS_MAPPINGS = mappings;
    await preloadAddresses();
  })
  .catch(err => console.log('Error in initial load', err));

const cache: {
  [key: string]: string
} = {};

fs.watch(MAPPINGS_PATH, async () => {
  console.log('Reloading DNS mappings');
  setTimeout(async () => {
    try {
      DNS_MAPPINGS = await loadMappings() || DNS_MAPPINGS;
      await preloadAddresses();
      console.log(DNS_MAPPINGS);
    } catch (err) {
      console.log('Error loading DNS mappings', err);
    }
  }, 500);
});

function loadMappings(): Promise<{
  [key: string]: string
}> {
  return new Promise((rs, rj) => {
    fs.readFile(MAPPINGS_PATH, {
      encoding: 'utf8',
    }, (err, data) => {
      if (err) {
        rj(err);
        return;
      }
      try {
        rs(JSON.parse(data));
      } catch (err2) {
        rj(err2);
      }
    });
  });
}

async function preloadAddresses() {
  Object.keys(DNS_MAPPINGS).forEach(async (key) => {
    const address = DNS_MAPPINGS[key];
    try {
      await download(address);
      console.log(`Successfully pre-loaded ${key}`);
    } catch (err) {
      console.log(`Error pre-loading ${key}: ${err}`);
    }
  });
}

const server = http.createServer(async (req, res) => {
  const ipfsAddress = DNS_MAPPINGS[req.headers.host];
  if (!ipfsAddress) {
    res.writeHead(404, {
      'Content-Type': 'text/plain',
    });
    res.end(`No mapping specified for host ${req.headers.host}`);
    return;
  }
  try {
    const data = await download(ipfsAddress);
    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end('Error retrieving ipfs data' + err);
  }
});

server.listen(3000, () => {
  console.log('http server listening on port 3000');
});

function download(ipfsAddress: string) {
  return new Promise((rs, rj) => {
    if (cache[ipfsAddress]) {
      rs(cache[ipfsAddress]);
      return;
    }
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
        cache[ipfsAddress] = rawData;
        rs(rawData);
      });
    });
  });
}

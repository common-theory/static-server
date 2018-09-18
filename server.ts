import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import https from 'https';
import fs from 'fs';
import IPFS from 'ipfs';
const node = new IPFS({
  config: {
    Bootstrap: [
      '/dns4/bootstrap.commontheory.io/tcp/8001/ipfs/QmQynHVRAVwcP3nsGW9s8Y1hLXN1Lc6a3WEasmC6iAxZBr'
    ]
  }
});

node.on('ready', async () => {
  console.log('IPFS node ready');
  preloadAddresses();
});

/**
 * The IPNS address of a json file that stores domain hostnames keyed to IPFS
 * hashes.
 **/
const MAPPING_ADDRESS = '/ipns/QmcizC46HXX5aqFw1z7xvvAN4YqMhgZB5H7pKv5Mfpr1TJ';

// Cache some IPFS files in memory
const cache: {
  [key: string]: string
} = {};

const serverHandler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const ipfsAddress = (await mappings())[req.headers.host];
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
};

const redirectHandler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  res.writeHead(301, {
    'Location': `https://${req.headers.host}${req.url}`,
  });
  res.end();
};

/**
 * The http server that proxies requests to IPFS resources. Mapping are done by
 * hostname -> ipfs address. These are stored in the mappings.json file.
 **/

http.createServer(process.env.REDIRECT_HTTPS ? redirectHandler : serverHandler).listen(3000, () => {
  console.log('http server listening on port 3000');
});

/**
 * The https server (if enabled)
 **/
if (process.env.ENABLE_HTTPS) {
  if (!process.env.HTTPS_CERT) {
    throw new Error('https enabled without cert');
  }
  if (!process.env.HTTPS_PRIVATE_KEY) {
    throw new Error('https enabled without private key');
  }
  const options = {
    key: fs.readFileSync(process.env.HTTPS_PRIVATE_KEY),
    cert: fs.readFileSync(process.env.HTTPS_CERT),
    ca: process.env.HTTPS_CERT_CA && fs.readFileSync(process.env.HTTPS_CERT_CA)
  };
  https.createServer(options, serverHandler).listen(3001, () => {
    console.log('https server listening on port 3001');
  });
}

/**
 * Load all IPFS addresses specified in the currently loaded mapping.
 **/
async function preloadAddresses() {
  const _mappings = await mappings();
  Object.keys(_mappings).forEach(async (key) => {
    const address = _mappings[key];
    try {
      await download(address);
      console.log(`Successfully pre-loaded ${key}`);
    } catch (err) {
      console.log(`Error pre-loading ${key}: ${err}`);
    }
  });
}

/**
 * Attempts to load a given ipfs address. Results are stored in the cache.
 **/
async function download(ipfsAddress: string) {
  const files = await node.files.get(ipfsAddress);
  if (files.length < 1) {
    console.log('No files found for address');
    return;
  } else if (files.length > 1) {
    console.log('Did not find single file at address');
    return;
  }
  const data = files[0].content.toString('utf8');
  cache[ipfsAddress] = data;
  return data;
}

/**
 * TODO: Use jsipfs ipns resolution in favor of maintaining two parallel
 * processes at the Dockerfile level
 **/
async function mappings(): Promise<{
  [key: string]: string
}> {
  let rawData = '';
  return new Promise((rs, rj) => {
    http.get(`http://localhost:8080${MAPPING_ADDRESS}`, (res) => {
      if (res.statusCode !== 200) {
        rj(new Error(`Request failed with status code: ${res.statusCode}`));
        return;
      }
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        rs(JSON.parse(rawData));
      });
    });
  }) as any;
}

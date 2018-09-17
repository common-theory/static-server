import http from 'http';
import fs from 'fs';
import path from 'path';

const MAPPINGS_PATH = path.resolve(__dirname, '../mappings.json');

/**
 * A key value mapping of domains -> ipfs addresses.
 **/
let DNS_MAPPINGS: {
  [key: string]: string
} = {};

/**
 * Load the mappings and preload the content into memory.
 **/
loadMappings()
  .then(async (mappings: any) => {
    DNS_MAPPINGS = mappings;
    await preloadAddresses();
  })
  .catch(err => console.log('Error in initial load', err));

// Cache some IPFS files in memory
const cache: {
  [key: string]: string
} = {};

/**
 * Watch the mapping json file for changes; when one occurs load the new mapping
 * into memory and attempt to load the contents into the cache
 **/
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

/**
 * Returns a promise resolving with the JSON data, or an error if either loading
 * or JSON parsing fails.
 **/
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

/**
 * Load all IPFS addresses specified in the currently loaded mapping.
 **/
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

/**
 * The http server that proxies requests to IPFS resources. Mapping are done by
 * hostname -> ipfs address. These are stored in the mappings.json file.
 **/
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

/**
 * Begin listening on port 3000.
 **/
server.listen(3000, () => {
  console.log('http server listening on port 3000');
});

/**
 * Attempts to load a given ipfs address. Results are stored in the cache.
 **/
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

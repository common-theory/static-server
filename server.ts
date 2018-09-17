import http from 'http';
import IPFS from 'ipfs';
const node = new IPFS({
  config: {
    Bootstrap: [
      '/dns4/bootstrap.commontheory.io/tcp/8001/ipfs/QmQynHVRAVwcP3nsGW9s8Y1hLXN1Lc6a3WEasmC6iAxZBr'
    ]
  }
});

const MAPPING_ADDRESS = '/ipns/QmcizC46HXX5aqFw1z7xvvAN4YqMhgZB5H7pKv5Mfpr1TJ';

node.on('ready', async () => {
  /**
   * A key value mapping of domains -> ipfs addresses.
   **/
  let DNS_MAPPINGS: {
    [key: string]: string
  } = {};

  /**
   * Load the mappings and preload the content into memory.
   **/
  mappings()
    .then(async (_mappings: any) => {
      console.log(_mappings);
      DNS_MAPPINGS = _mappings;
      await preloadAddresses();
    })
    .catch(err => console.log('Error in initial load', err));

  // Cache some IPFS files in memory
  const cache: {
    [key: string]: string
  } = {};

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

  async function mappings() {
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
    });
  }
});

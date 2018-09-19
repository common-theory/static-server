# static-server [![CircleCI](https://circleci.com/gh/common-theory/static-server.svg?style=shield)](https://circleci.com/gh/common-theory/static-server)

A nodejs webserver capable of serving domain -> ipfs address mapped indexes.

## Environment variables

- `MAPPING_ADDRESS` - The IPNS address of the json file specifying the mappings (required).
- `ENABLE_HTTPS` - Set to a truthy value to enable.
- `HTTPS_CERT` - Path to the https cert (required if https enabled).
- `HTTPS_PRIVATE_KEY` - Path to https private key (required if https enabled).
- `HTTPS_CERT_CA` - Path to certificate authority chain (optional, by default uses mozilla CA)
- `REDIRECT_HTTPS` - Set to a truthy value to redirect http requests to `https://${req.headers.host}${req.url}`.

## Mappings

A mappings file can be supplied to map domain names to IPFS addresses. An example mapping might look like this:

```json
{
  "commontheory.io": "QmSGmMfDk6UetsuwqA25jpmFHX9CfeqSGVgGLFynwRJXzs",
  "localhost:3000": "QmSGmMfDk6UetsuwqA25jpmFHX9CfeqSGVgGLFynwRJXzs"
}
```

This file should be added at a pre-specified IPNS address. That IPNS address should be passed as `MAPPING_ADDRESS`. Using IPNS for publishing allows automatic mapping propagation to servers.

#!/bin/bash

set -e

ipfs init
ipfs bootstrap add /dnsaddr/bootstrap.commontheory.io/tcp/8001/ipfs/QmQynHVRAVwcP3nsGW9s8Y1hLXN1Lc6a3WEasmC6iAxZBr
ipfs daemon --enable-namesys-pubsub &

# Wait for the daemon to come up
sleep 5

# Start the http proxy
( cd /server ; npm start & )

while sleep 20; do
  # Ensure processes are still alive
  ps ax | grep node | grep -q -v grep
  if [ $? -ne 0 ]; then
    echo "Node process exited"
    exit 1
  fi
  ps ax | grep ipfs | grep -q -v grep
  if [ $? -ne 0 ]; then
    echo "IFPS daemon process exited"
    exit 1
  fi
  # Download the latest published mappings via ipns
  # Only do this if there isn't already a load process running
  ps ax | grep mappings.json | grep -q -v grep || ( cd /server ; npm run load-mappings )
done

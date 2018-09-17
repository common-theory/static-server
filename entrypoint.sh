#!/bin/bash

set -e

ipfs init
ipfs bootstrap add /dnsaddr/bootstrap.commontheory.io/tcp/8001/ipfs/QmQynHVRAVwcP3nsGW9s8Y1hLXN1Lc6a3WEasmC6iAxZBr
ipfs daemon --enable-namesys-pubsub &

# Wait for the daemon to come up
sleep 5

# Start the http proxy
( cd /server ; npm start & )

while sleep 60; do
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
done

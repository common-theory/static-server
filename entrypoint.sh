#!/bin/bash

set -e

ipfs init
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
  ( cd /server ; npm run load-mappings )
done

#!/bin/bash

set -e

ipfs init
ipfs daemon &
node /server/build/server.js &

while sleep 20; do
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

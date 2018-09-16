#!/bin/bash

set -e

ipfs init
ipfs daemon &
nginx -g "daemon off;" &

while sleep 20; do
  ps ax | grep nginx | grep -q -v grep
  if [ $? -ne 0 ]; then
    echo "NGINX process exited"
    exit 1
  fi
  ps ax | grep ipfs | grep -q -v grep
  if [ $? -ne 0 ]; then
    echo "IFPS daemon process exited"
    exit 1
  fi
done

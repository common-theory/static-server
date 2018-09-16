FROM alpine:latest
MAINTAINER Chance Hudson

# Install ipfs
RUN mkdir /install && \
  cd /install && \
  wget https://dist.ipfs.io/go-ipfs/v0.4.17/go-ipfs_v0.4.17_linux-386.tar.gz && \
  tar xvfz go-ipfs_v0.4.17_linux-386.tar.gz && \
  cd go-ipfs && \
  ./install.sh && \
  ipfs help && \
  cd / && \
  rm -rf /install

# Install node
RUN apk add --no-cache bash nodejs-npm

COPY . /server

RUN cd /server && \
  npm install && \
  npm run build && \
  rm -rf node_modules

EXPOSE 3000

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

FROM alpine:latest
MAINTAINER Chance Hudson

# Install nginx
RUN apk add --no-cache bash nginx && \
  mkdir -p /run/nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh

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

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]

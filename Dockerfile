FROM alpine:latest
MAINTAINER Chance Hudson

# Install ipfs
RUN mkdir /install && \
  cd /install && \
  wget https://dist.ipfs.io/go-ipfs/v0.4.17/go-ipfs_v0.4.17_linux-386.tar.gz && \
  tar xvfz go-ipfs_v0.4.17_linux-386.tar.gz && \
  cd go-ipfs && \
  ./install.sh

# Install node et al
RUN apk add --no-cache bash nodejs-npm git python make g++ gcc

COPY . /server

RUN cd /server && \
  npm install && \
  npm run build

FROM alpine:latest
MAINTAINER Chance Hudson

RUN apk add --no-cache nodejs-npm

COPY --from=0 /usr/local/bin/ipfs /usr/local/bin/ipfs
COPY --from=0 /server /server

EXPOSE 3000

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

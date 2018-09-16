import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain',
  });
  res.end('done');
});

server.listen(3000, () => {
  console.log('http server listening on port 3000');
});

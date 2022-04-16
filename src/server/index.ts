import '../config/module-alias';

import * as http from 'http';

const port = parseInt(process.env.PORT || '3333', 10);
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      date: new Date().toISOString(),
      message: 'Hello World!',
    }),
  );
});

server.on('listening', () => {
  // eslint-disable-next-line no-console
  console.log(`Server is listening on port ${port}`);
});

server.listen(port);

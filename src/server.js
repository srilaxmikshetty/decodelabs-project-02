const http = require('node:http');
const { createApp } = require('./app');

const PORT = Number(process.env.PORT || 3000);
const server = http.createServer(createApp());

server.listen(PORT, () => console.log(`DecodeLabs Project 2 API running on http://localhost:${PORT}`));

function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(() => process.exit(0));
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

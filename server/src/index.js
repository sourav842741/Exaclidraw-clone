import http from 'node:http';
import { WebSocketServer } from 'ws';
import app from './app.js';
import dns from "dns";
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { initSocketServer } from './sockets/index.js';
import { handleYjsConnection, initYjsPersistence } from './crdt/yjs.js';
import { startWorkers } from './workers/index.js';

dns.setServers(["1.1.1.1", "8.8.8.8"]);


async function bootstrap() {
  await connectDB();
  await startWorkers();
  await initYjsPersistence();

  const server = http.createServer(app);

  // Socket.IO for presence/cursors/chat/comments/reactions
  const io = initSocketServer(server);

  // Yjs WebSocket for CRDT collaboration
  const wss = new WebSocketServer({ server, path: '/ws/collab' });
  wss.on('connection', (ws, req) => {
    try {
      handleYjsConnection(ws, req, true);
    } catch (err) {
      logger.error(`Yjs WS error: ${err.message}`);
      ws.close();
    }
  });

  server.listen(env.port, () => {
    logger.info(`🚀 VectorShare AI server running on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down...`);
    server.close();
    io.close();
    wss.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error(`Fatal startup error: ${err.message}`);
  process.exit(1);
});

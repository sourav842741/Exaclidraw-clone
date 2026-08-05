import amqp from 'amqplib';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let connection = null;
let channel = null;

export const QUEUES = {
  EMAIL: 'vectorshare.email',
  NOTIFICATIONS: 'vectorshare.notifications',
  AI_JOBS: 'vectorshare.ai',
  EXPORT_JOBS: 'vectorshare.export',
};

async function connect() {
  if (channel) return channel;
  try {
    connection = await amqp.connect(env.rabbitmqUrl);
    channel = await connection.createChannel();
    channel.prefetch(10);
    for (const q of Object.values(QUEUES)) {
      await channel.assertQueue(q, { durable: true });
    }
    logger.info('RabbitMQ connected');
    return channel;
  } catch (err) {
    logger.warn(`RabbitMQ unavailable (${err.message}) — queuing disabled`);
    return null;
  }
}

export async function publishToQueue(queue, payload) {
  const ch = await connect();
  if (!ch) return false;
  try {
    ch.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
    return true;
  } catch (err) {
    logger.error(`RabbitMQ publish failed: ${err.message}`);
    return false;
  }
}

export async function consume(queue, handler) {
  const ch = await connect();
  if (!ch) return;
  ch.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      await handler(data);
      ch.ack(msg);
    } catch (err) {
      logger.error(`Consumer error on ${queue}: ${err.message}`);
      ch.nack(msg, false, false);
    }
  });
}

export async function closeRabbit() {
  if (connection) await connection.close();
}

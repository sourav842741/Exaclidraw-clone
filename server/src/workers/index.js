import { consume, QUEUES } from '../config/rabbitmq.js';
import { logger } from '../utils/logger.js';
import { mailService } from '../utils/mail.js';
import { notificationRepository } from '../repositories/notification.repo.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function startWorkers() {
  // Email queue — retries up to 3 times
  await consume(QUEUES.EMAIL, async (payload) => {
    const { type, to, ...rest } = payload;
    try {
      switch (type) {
        case 'verification':
          await mailService.sendVerificationEmail(to, rest.name, rest.token);
          break;
        case 'password-reset':
          await mailService.sendPasswordResetEmail(to, rest.name, rest.token);
          break;
        case 'notification':
          await mailService.sendNotificationEmail(to, rest.name, rest.title, rest.message);
          break;
        default:
          logger.warn(`Unknown email type: ${type}`);
      }
    } catch (err) {
      logger.error(`Email worker error: ${err.message}`);
      throw err;
    }
  });

  // Notifications queue — ensures notification exists + optionally emails
  await consume(QUEUES.NOTIFICATIONS, async (payload) => {
    const { recipientId, notification } = payload;
    if (!notification?._id) return;
    const existing = await notificationRepository.findById(notification._id);
    if (!existing) {
      await notificationRepository.create({
        recipient: recipientId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        link: notification.link || '',
      });
    }
    if (notification.type === 'invite') {
      const user = await (await import('../repositories/user.repo.js')).userRepository.findById(recipientId);
      if (user?.email) {
        await publishEmail('notification', user.email, user.name, notification.title, notification.message);
      }
    }
    return sleep(0);
  });

  // AI queue — placeholder for heavy AI jobs
  await consume(QUEUES.AI_JOBS, async (payload) => {
    logger.info(`AI job received: ${payload.jobId || 'unknown'}`);
  });

  logger.info('RabbitMQ workers started');
}

async function publishEmail(type, to, name, title, message) {
  const { publishToQueue } = await import('../config/rabbitmq.js');
  return publishToQueue(QUEUES.EMAIL, { type, to, name, title, message });
}

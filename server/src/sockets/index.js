import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { userRepository } from '../repositories/user.repo.js';
import { boardService } from '../services/board.service.js';
import { notificationService } from '../services/notification.service.js';
import { logger } from '../utils/logger.js';
import { pubSub } from '../config/redis.js';
import { publishToQueue, QUEUES } from '../config/rabbitmq.js';
import { Comment } from '../models/comment.model.js';

const NOTIF_CHANNEL = 'vectorshare:notifications';

function getColor(name = '') {
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#84cc16'];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const roomState = new Map(); // boardId -> { users: Map(socketId -> userData), cursors: Map }

export function leaveBoard(socket, boardId) {
  const state = roomState.get(boardId);
  if (!state) return;
  state.users.delete(socket.id);
  state.cursors.delete(socket.id);
  if (state.users.size === 0) roomState.delete(boardId);
  socket.to(`board:${boardId}`).emit('presence:leave', { socketId: socket.id });
  socket.leave(`board:${boardId}`);
}

export function initSocketServer(server) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, cb) => cb(null, true),
      credentials: true,
    },
    maxHttpBufferSize: 1e8,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('authentication required'));
      const payload = verifyAccessToken(token);
      const user = await userRepository.findById(payload.sub);
      if (!user || !user.isActive) return next(new Error('user not found'));
      socket.user = user;
      socket.userColor = getColor(user.name);
      next();
    } catch {
      next(new Error('authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;

    socket.on('board:join', async ({ boardId }, cb) => {
      try {
        await boardService.authorize(boardId, user._id, ['viewer', 'commenter', 'editor', 'owner']);
        socket.join(`board:${boardId}`);
        socket.data.boardId = boardId;

        if (!roomState.has(boardId)) roomState.set(boardId, { users: new Map(), cursors: new Map() });
        const state = roomState.get(boardId);
        const userData = {
          socketId: socket.id,
          userId: String(user._id),
          name: user.name,
          avatar: user.avatar,
          color: socket.userColor,
          joinedAt: Date.now(),
        };
        state.users.set(socket.id, userData);

        socket.to(`board:${boardId}`).emit('presence:join', {
          user: state.users.get(socket.id),
        });

        io.to(`board:${boardId}`).emit('presence:list', {
          users: Array.from(state.users.values()),
        });

        await notificationService.setPresence(user._id, { boardId, online: true });
        socket.emit('board:joined', { boardId });
        if (cb) cb({ ok: true });
      } catch (err) {
        if (cb) cb({ ok: false, error: err.message });
      }
    });

    socket.on('board:leave', async ({ boardId }) => {
      leaveBoard(socket, boardId);
      await notificationService.clearPresence(user._id);
    });

    socket.on('cursor:update', ({ boardId, x, y }) => {
      const state = roomState.get(boardId);
      if (!state) return;
      state.cursors.set(socket.id, { x, y, userId: String(user._id), name: user.name, color: socket.userColor });
      socket.to(`board:${boardId}`).emit('cursor:move', {
        socketId: socket.id,
        x,
        y,
        user: { id: String(user._id), name: user.name, color: socket.userColor },
      });
    });

    socket.on('cursor:clear', ({ boardId }) => {
      const state = roomState.get(boardId);
      if (!state) return;
      state.cursors.delete(socket.id);
      socket.to(`board:${boardId}`).emit('cursor:left', { socketId: socket.id });
    });

    socket.on('selection:update', ({ boardId, elementIds }) => {
      socket.to(`board:${boardId}`).emit('selection:update', {
        socketId: socket.id,
        userId: String(user._id),
        elementIds,
      });
    });

    socket.on('element:lock', ({ boardId, elementId, locked }) => {
      socket.to(`board:${boardId}`).emit('element:lock', { elementId, locked });
    });

    // ----- Chat -----
    socket.on('chat:message', async ({ boardId, text }) => {
      if (!text?.trim()) return;
      const message = {
        id: `${Date.now()}-${socket.id}`,
        boardId,
        text: text.slice(0, 2000),
        user: { id: String(user._id), name: user.name, avatar: user.avatar, color: socket.userColor },
        createdAt: new Date().toISOString(),
      };
      io.to(`board:${boardId}`).emit('chat:message', message);
    });

    // ----- Comments (realtime) -----
    socket.on('comment:add', async ({ boardId, body, x, y, elementId }, cb) => {
      try {
        const comment = await Comment.create({ boardId, author: user._id, body, x, y, elementId });
        await comment.populate('author');
        io.to(`board:${boardId}`).emit('comment:added', comment.toObject());
        if (cb) cb({ ok: true, comment: comment.toObject() });
      } catch (err) {
        if (cb) cb({ ok: false, error: err.message });
      }
    });

    socket.on('comment:resolve', async ({ boardId, commentId, resolved }, cb) => {
      try {
        const comment = await Comment.findByIdAndUpdate(commentId, { resolved }, { new: true });
        io.to(`board:${boardId}`).emit('comment:resolved', comment);
        if (cb) cb({ ok: true });
      } catch (err) {
        if (cb) cb({ ok: false, error: err.message });
      }
    });

    // ----- Reactions -----
    socket.on('reaction:add', ({ boardId, emoji }) => {
      socket.to(`board:${boardId}`).emit('reaction:added', {
        emoji,
        user: { id: String(user._id), name: user.name, color: socket.userColor },
        socketId: socket.id,
      });
    });

    // ----- Notifications via Redis Pub/Sub + RabbitMQ -----
    socket.on('notification:create', async ({ recipientId, type, title, message, link }) => {
      try {
        const result = await notificationService.createForUser(recipientId, { type, title, message, link });
        const payload = JSON.stringify({
          recipientId,
          notification: result.notification,
          unread: result.unread,
        });
        await pubSub.publish(NOTIF_CHANNEL, payload);
        await publishToQueue(QUEUES.NOTIFICATIONS, JSON.parse(payload));
      } catch (err) {
        logger.error(`notification:create error: ${err.message}`);
      }
    });

    socket.on('disconnect', async () => {
      const boardId = socket.data.boardId;
      if (boardId) leaveBoard(socket, boardId);
      await notificationService.clearPresence(user._id);
    });
  });

  // Redis Pub/Sub relay for notifications across processes
  const sub = pubSub.duplicate();
  sub.on('error', (err) => logger.warn(`Redis[pubsub-sub] error: ${err.message}`));
  sub.subscribe(NOTIF_CHANNEL).catch(() => {
    logger.warn('Redis Pub/Sub unavailable — notifications relay disabled');
  });
  sub.on('message', (channel, message) => {
    if (channel !== NOTIF_CHANNEL) return;
    try {
      const payload = JSON.parse(message);
      io.to(`user:${payload.recipientId}`).emit('notification:new', payload);
    } catch {
      // ignore
    }
  });

  return io;
}

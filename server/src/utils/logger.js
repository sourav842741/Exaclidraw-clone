import winston from 'winston';

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    const base = `${timestamp} ${level.toUpperCase()}: ${message}`;
    return stack ? `${base}\n${stack}` : base;
  }),
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format,
  transports: [
    new winston.transports.Console({ format: winston.format.colorize({ all: true }) }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

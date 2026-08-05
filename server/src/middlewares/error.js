import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

export function errorHandler(err, req, res) {
  let error = err;

  if (err instanceof mongoose.Error.ValidationError) {
    error = new ApiError(400, 'Validation error', Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })));
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    error = new ApiError(409, `${field} already exists`);
  } else if (err.name === 'CastError') {
    error = new ApiError(400, 'Invalid id format');
  } else if (err.type === 'entity.too.large') {
    error = new ApiError(413, 'Payload too large');
  }

  if (!(error instanceof ApiError)) {
    logger.error(`Unhandled error: ${err.message}\n${err.stack}`);
    error = new ApiError(500, process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message);
  }

  if (error.statusCode >= 500) logger.error(`${req.method} ${req.originalUrl} -> ${error.message}`);

  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

export function notFound(req, res) {
  return res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

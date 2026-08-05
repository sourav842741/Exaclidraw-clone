export class ApiError extends Error {
  constructor(statusCode, message, details = undefined, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const BadRequest = (msg, details) => new ApiError(400, msg, details);
export const Unauthorized = (msg = 'Unauthorized') => new ApiError(401, msg);
export const Forbidden = (msg = 'Forbidden') => new ApiError(403, msg);
export const NotFound = (msg = 'Not found') => new ApiError(404, msg);
export const Conflict = (msg = 'Conflict') => new ApiError(409, msg);
export const TooManyRequests = (msg = 'Too many requests') => new ApiError(429, msg);
export const InternalError = (msg = 'Internal server error') => new ApiError(500, msg, undefined, false);

export const success = (res, statusCode, data = {}, message = 'Success') =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });

export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

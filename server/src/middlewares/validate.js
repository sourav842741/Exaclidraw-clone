import { BadRequest } from '../utils/errors.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
  const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));
    return next(BadRequest('Validation failed', details));
  }
  if (source === 'body') req.body = value;
  else if (source === 'query') req.query = value;
  else req.params = value;
  return next();
};

import { test } from 'node:test';
import assert from 'node:assert';
import { registerSchema, loginSchema } from '../src/validators/auth.validator.js';
import { createBoardSchema } from '../src/validators/board.validator.js';

test('registerSchema accepts valid input', () => {
  const { error } = registerSchema.validate({ name: 'John', email: 'john@example.com', password: 'password123' });
  assert.equal(error, undefined);
});

test('registerSchema rejects short password', () => {
  const { error } = registerSchema.validate({ name: 'John', email: 'john@example.com', password: 'short' });
  assert.ok(error);
});

test('loginSchema rejects bad email', () => {
  const { error } = loginSchema.validate({ email: 'not-an-email', password: 'whatever' });
  assert.ok(error);
});

test('createBoardSchema defaults type to whiteboard', () => {
  const { value } = createBoardSchema.validate({ name: 'My Board' });
  assert.equal(value.type, 'whiteboard');
});

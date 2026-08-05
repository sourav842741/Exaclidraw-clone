import { test } from 'node:test';
import assert from 'node:assert';
import { paginate, buildPagination, slugify, generateToken } from '../src/utils/helpers.js';

test('paginate defaults', () => {
  assert.deepEqual(paginate({}), { skip: 0, limit: 20, page: 1 });
});

test('paginate clamps limit', () => {
  assert.equal(paginate({ limit: 500 }).limit, 100);
  assert.equal(paginate({ page: 0 }).page, 1);
});

test('buildPagination', () => {
  assert.deepEqual(buildPagination(45, 2, 20), { total: 45, page: 2, limit: 20, pages: 3 });
});

test('slugify', () => {
  assert.equal(slugify('  Hello World!  '), 'hello-world');
});

test('generateToken length', () => {
  assert.equal(generateToken(24).length, 24);
});

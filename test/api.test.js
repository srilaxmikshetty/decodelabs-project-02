const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');
const store = require('../src/store/userStore');

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(createApp());
    server.listen(0, () => {
      const { port } = server.address();
      const data = body ? JSON.stringify(body) : null;
      const req = http.request({ hostname: '127.0.0.1', port, path, method, headers: { ...(data ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } : {}), ...headers } }, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => { server.close(); resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : null }); });
      });
      req.on('error', (err) => { server.close(); reject(err); });
      if (data) req.write(data);
      req.end();
    });
  });
}

test.beforeEach(() => store.reset());

test('GET /api/health returns 200', async () => {
  const res = await request('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'ok');
});

test('POST /api/users rejects missing API key', async () => {
  const res = await request('POST', '/api/users', { name: 'Ada Lovelace', email: 'ada@example.com' });
  assert.equal(res.status, 401);
});

test('user CRUD flow works', async () => {
  const headers = { 'x-api-key': 'decodelabs-project2-key' };
  const created = await request('POST', '/api/users', { name: 'Ada Lovelace', email: 'ada@example.com' }, headers);
  assert.equal(created.status, 201);
  assert.equal(created.body.data.email, 'ada@example.com');
  const id = created.body.data.id;

  const fetched = await request('GET', `/api/users/${id}`);
  assert.equal(fetched.status, 200);

  const updated = await request('PATCH', `/api/users/${id}`, { role: 'admin' }, headers);
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.role, 'admin');

  const deleted = await request('DELETE', `/api/users/${id}`, null, headers);
  assert.equal(deleted.status, 204);
});

test('invalid user data returns 400', async () => {
  const res = await request('POST', '/api/users', { name: 'A', email: 'bad' }, { 'x-api-key': 'decodelabs-project2-key' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

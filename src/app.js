const store = require('./store/userStore');
const { validateUserPayload } = require('./utils/validation');

function json(res, status, payload, headers = {}) {
  const body = payload === undefined ? '' : JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (Buffer.byteLength(raw) > 10 * 1024) {
        const err = new Error('Payload too large');
        err.code = 'PAYLOAD_TOO_LARGE';
        reject(err);
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { const err = new Error('Invalid JSON'); err.code = 'INVALID_JSON'; reject(err); }
    });
    req.on('error', reject);
  });
}

function sendError(res, status, code, message, details) {
  return json(res, status, { success: false, error: { code, message, ...(details ? { details } : {}) } });
}

function auth(req, res) {
  const expected = process.env.API_KEY || 'decodelabs-project2-key';
  if (req.headers['x-api-key'] !== expected) {
    sendError(res, 401, 'UNAUTHORIZED', 'A valid x-api-key header is required for this operation.');
    return false;
  }
  return true;
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace(/\/$/, '') || '/';
  const segments = path.split('/').filter(Boolean);

  const commonHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  };
  for (const [k, v] of Object.entries(commonHeaders)) res.setHeader(k, v);

  if (req.method === 'OPTIONS') return json(res, 204, undefined);

  if (segments.length === 2 && segments[0] === 'api' && segments[1] === 'health' && req.method === 'GET') {
    return json(res, 200, { success: true, data: { status: 'ok', service: 'decodelabs-project-2-api' } });
  }

  if (segments[0] !== 'api' || segments[1] !== 'users' || segments.length > 3) {
    return sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.url} was not found.`);
  }

  const id = segments[2] ? parseId(segments[2]) : null;
  if (segments[2] && !id) return sendError(res, 400, 'INVALID_ID', 'User id must be a positive integer.');

  if (segments.length === 2 && req.method === 'GET') {
    const page = Math.max(Number.parseInt(url.searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get('limit') || '10', 10), 1), 100);
    const users = store.list();
    const data = users.slice((page - 1) * limit, page * limit);
    return json(res, 200, { success: true, data, meta: { page, limit, total: users.length, totalPages: Math.ceil(users.length / limit) } });
  }

  if (segments.length === 3 && req.method === 'GET') {
    const user = store.findById(id);
    return user ? json(res, 200, { success: true, data: user }) : sendError(res, 404, 'USER_NOT_FOUND', 'User was not found.');
  }

  if (!auth(req, res)) return;

  if (segments.length === 2 && req.method === 'POST') {
    const body = await readJson(req);
    const validation = validateUserPayload(body);
    if (!validation.valid) return sendError(res, 400, 'VALIDATION_ERROR', 'Request data is invalid.', validation.errors);
    if (store.findByEmail(validation.value.email)) return sendError(res, 409, 'EMAIL_EXISTS', 'A user with this email already exists.');
    return json(res, 201, { success: true, data: store.create(validation.value) });
  }

  if (segments.length === 3 && ['PUT', 'PATCH'].includes(req.method)) {
    if (!store.findById(id)) return sendError(res, 404, 'USER_NOT_FOUND', 'User was not found.');
    const body = await readJson(req);
    const validation = validateUserPayload(body, { partial: req.method === 'PATCH' });
    if (!validation.valid) return sendError(res, 400, 'VALIDATION_ERROR', 'Request data is invalid.', validation.errors);
    if (validation.value.email) {
      const duplicate = store.findByEmail(validation.value.email);
      if (duplicate && duplicate.id !== id) return sendError(res, 409, 'EMAIL_EXISTS', 'A user with this email already exists.');
    }
    return json(res, 200, { success: true, data: store.update(id, validation.value) });
  }

  if (segments.length === 3 && req.method === 'DELETE') {
    if (!store.remove(id)) return sendError(res, 404, 'USER_NOT_FOUND', 'User was not found.');
    res.writeHead(204, commonHeaders); return res.end();
  }

  return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'HTTP method is not supported for this resource.');
}

function createApp() {
  return (req, res) => {
    handle(req, res).catch(err => {
      if (!res.headersSent) {
        if (err.code === 'INVALID_JSON') return sendError(res, 400, 'INVALID_JSON', 'Request body contains invalid JSON.');
        if (err.code === 'PAYLOAD_TOO_LARGE') return sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
        return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected server error occurred.');
      }
      res.end();
    });
  };
}

module.exports = { createApp };

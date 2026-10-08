const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = new Set(['user', 'admin']);

function validateUserPayload(body, { partial = false } = {}) {
  const errors = [];
  const data = body && typeof body === 'object' && !Array.isArray(body) ? body : {};

  if (!partial || Object.prototype.hasOwnProperty.call(data, 'name')) {
    if (typeof data.name !== 'string' || data.name.trim().length < 2 || data.name.trim().length > 80) {
      errors.push({ field: 'name', message: 'Name must be a string between 2 and 80 characters.' });
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(data, 'email')) {
    if (typeof data.email !== 'string' || !EMAIL_RE.test(data.email.trim())) {
      errors.push({ field: 'email', message: 'Email must be a valid email address.' });
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, 'role')) {
    if (typeof data.role !== 'string' || !ROLES.has(data.role)) {
      errors.push({ field: 'role', message: 'Role must be either "user" or "admin".' });
    }
  }

  const allowed = new Set(['name', 'email', 'role']);
  for (const key of Object.keys(data)) {
    if (!allowed.has(key)) errors.push({ field: key, message: 'Unknown field.' });
  }

  if (partial && Object.keys(data).length === 0) {
    errors.push({ field: 'body', message: 'At least one field is required.' });
  }

  return {
    valid: errors.length === 0,
    errors,
    value: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.email !== undefined ? { email: data.email.trim().toLowerCase() } : {}),
      ...(data.role !== undefined ? { role: data.role } : {})
    }
  };
}

module.exports = { validateUserPayload };

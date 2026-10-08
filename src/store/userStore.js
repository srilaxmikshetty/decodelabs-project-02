const users = new Map();
let nextId = 1;

function list() {
  return Array.from(users.values());
}

function findById(id) {
  return users.get(Number(id)) || null;
}

function findByEmail(email) {
  const normalized = String(email).trim().toLowerCase();
  return list().find((user) => user.email === normalized) || null;
}

function create({ name, email, role = 'user' }) {
  const now = new Date().toISOString();
  const user = { id: nextId++, name, email, role, createdAt: now, updatedAt: now };
  users.set(user.id, user);
  return user;
}

function update(id, changes) {
  const existing = findById(id);
  if (!existing) return null;
  const updated = { ...existing, ...changes, id: existing.id, updatedAt: new Date().toISOString() };
  users.set(existing.id, updated);
  return updated;
}

function remove(id) {
  const existing = findById(id);
  if (!existing) return null;
  users.delete(Number(id));
  return existing;
}

function reset() {
  users.clear();
  nextId = 1;
}

module.exports = { list, findById, findByEmail, create, update, remove, reset };

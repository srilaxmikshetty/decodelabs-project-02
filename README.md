# DecodeLabs Project 2 — Backend API Development

A dependency-free Node.js REST API built from the supplied DecodeLabs Project 2 brief. It demonstrates GET/POST endpoints, user input and JSON responses, validation, RESTful naming, meaningful HTTP status codes, authentication, resilience/security headers, documentation, and CRUD behavior.

## Stack

- Node.js 18+
- Node's built-in `http` module
- In-memory store (no database required)
- No third-party packages or internet access required

## Run

```bash
npm start
```

API: `http://localhost:3000`

To use a custom port/key:

```bash
PORT=4000 API_KEY=my-secret-key npm start
```

Tests:

```bash
npm test
```

## Authentication

Mutation endpoints require `x-api-key`. The development default is `decodelabs-project2-key`.

## Endpoints

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/health` | Health check | No |
| GET | `/api/users` | List users | No |
| GET | `/api/users/:id` | Retrieve one user | No |
| POST | `/api/users` | Create user | API key |
| PUT | `/api/users/:id` | Replace/update user | API key |
| PATCH | `/api/users/:id` | Partially update user | API key |
| DELETE | `/api/users/:id` | Remove user | API key |

### Create a user

```bash
curl -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: decodelabs-project2-key' \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","role":"user"}'
```

### List users

```bash
curl 'http://localhost:3000/api/users?page=1&limit=10'
```

### Update a user

```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: decodelabs-project2-key' \
  -d '{"role":"admin"}'
```

## Validation and status codes

- `200 OK` — successful retrieval/update
- `201 Created` — successful creation
- `204 No Content` — successful deletion
- `400 Bad Request` — malformed JSON, invalid id, or validation failure
- `401 Unauthorized` — missing/invalid API key
- `404 Not Found` — unknown route or user
- `405 Method Not Allowed` — unsupported HTTP method
- `409 Conflict` — duplicate email
- `413 Payload Too Large` — body exceeds 10 KB
- `500 Internal Server Error` — unexpected server failure

## Architecture

`Request → HTTP/security middleware → Route matching → Validation → Controller logic → Store → JSON response`

Resources are nouns (`/users`) and HTTP methods express actions. Input is validated at the API boundary. CORS, request-size limits, security headers, API-key authentication, centralized error responses, stateless request handling, and graceful shutdown address the security/resilience themes in the supplied project material.

## Notes

The supplied brief focuses on backend API fundamentals and does not mandate a database or framework. This implementation intentionally uses an in-memory store so it can be evaluated immediately with only Node.js installed. Data resets when the server restarts.

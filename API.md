# API Examples

## 1. Health

`GET /api/health`

Response `200`:

```json
{"success":true,"data":{"status":"ok","service":"decodelabs-project-2-api"}}
```

## 2. Create

`POST /api/users`

Headers:

```text
Content-Type: application/json
x-api-key: decodelabs-project2-key
```

Body:

```json
{"name":"Ada Lovelace","email":"ada@example.com","role":"user"}
```

## 3. Get

`GET /api/users/1`

## 4. Update

`PATCH /api/users/1`

```json
{"name":"Ada Byron Lovelace"}
```

## 5. Delete

`DELETE /api/users/1`

Returns `204` with an empty body.

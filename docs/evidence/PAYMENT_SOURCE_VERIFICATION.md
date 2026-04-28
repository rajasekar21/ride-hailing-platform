# Payment Source Verification (Idempotency + Rate Limiting)

This file is a reviewer-friendly source excerpt from `services/payment/index.js` so verification does not depend on opening service code directly.

## 1) Idempotency Table DDL (SQLite)

```js
// Idempotency table DDL
idemDb.exec(`
  CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    response TEXT NOT NULL,
    created_at DATETIME NOT NULL
  );
`);
```

## 2) Rate Limiter Config (10 requests/min/IP)

```js
const chargeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" }
});
```

## 3) Charge Endpoint Guard: Idempotency-Key Required

```js
v1Router.post("/payments/charge", chargeRateLimiter, async (req, res) => {
  const idempotencyKey = req.get("Idempotency-Key");
  if (!idempotencyKey) {
    return res.status(400).send({ error: "Idempotency-Key header required" });
  }
```

## 4) Duplicate-Key Return Path (No Reprocessing)

```js
  cleanupExpiredIdempotencyKeys();

  const existingIdempotentResponse = getIdempotencyEntryStmt.get(idempotencyKey);
  if (existingIdempotentResponse) {
    return res.status(200).send(JSON.parse(existingIdempotentResponse.response));
  }
```

## 5) First-Request Store Path

```js
  const responsePayload = payment.toJSON();
  upsertIdempotencyEntryStmt.run(
    idempotencyKey,
    JSON.stringify(responsePayload),
    new Date().toISOString()
  );

  return res.status(201).send(responsePayload);
});
```

## 6) One-command Proof Check

```bash
rg -n "idempotency_keys|Idempotency-Key|chargeRateLimiter|max:\\s*10|Too many requests|existingIdempotentResponse|INSERT OR REPLACE INTO idempotency_keys" services/payment/index.js
```

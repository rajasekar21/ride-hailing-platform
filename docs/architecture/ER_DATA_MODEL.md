# ER and Data Model Documentation

This document captures the database-per-service data model for assignment submission.

## Database-per-Service

- User service -> `riders` table
- Driver service -> `drivers` table
- Ride service -> `trips` table
- Payment service -> `payments` table
- Rating service -> `ratings` table

No cross-service SQL joins are used. Services communicate via HTTP and RabbitMQ events.

## Core Entities

### Rider

- `rider_id` (PK)
- `name`
- `email`
- `phone`
- `city`
- `password`
- `role`

### Driver

- `driver_id` (PK)
- `name`
- `vehicle_type`
- `vehicle_plate`
- `is_active`
- `city`
- `password`
- `role`

### Trip

- `trip_id` (PK)
- `rider_id` (logical reference to rider service)
- `driver_id` (logical reference to driver service)
- `pickup_location`
- `drop_location`
- `city`
- `distance_km`
- `surge_multiplier`
- `base_fare`
- `fare`
- `trip_status`
- `payment_status`

### Payment

- `payment_id` (PK)
- `trip_id` (logical reference to ride service)
- `amount`
- `currency`
- `status`
- `idempotency_key`
- `refund_idempotency_key`

### Rating

- `rating_id` (PK)
- `trip_id` (logical reference to ride service)
- `rider_id`
- `driver_id`
- `score`
- `comment`

## ER Diagram Artifact

Add your ER diagram image here:

- `docs/architecture/er-diagram.png`
- Mermaid source: `docs/architecture/ER_DIAGRAM.md`

Also add one screenshot in:

- `docs/screenshots/evidence-er-diagram.png`

## Plain-Text ER Summary (Reviewer-Friendly)

This section mirrors the Mermaid ER in plain text so evaluators can verify content without rendering diagrams.

### Riders (User Service DB)

- Primary key: `id`
- Important fields: `name`, `email`, `phone`, `city`, `password`, `role`, `created_at`

### Drivers (Driver Service DB)

- Primary key: `id`
- Important fields: `name`, `phone`, `email`, `vehicle_type`, `vehicle_plate`, `is_active`, `city`, `password`, `role`, `created_at`

### Trips (Ride Service DB)

- Primary key: `id`
- Logical references: `rider_id` -> riders.id (service-level), `driver_id` -> drivers.id (service-level)
- Important fields: `pickup_location`, `drop_location`, `city`, `distance_km`, `surge_multiplier`, `base_fare`, `fare_amount`, `trip_status`, `payment_status`
- Lifecycle timestamps: `requested_at`, `accepted_at`, `completed_at`, `cancelled_at`

### Payments (Payment Service DB)

- Primary key: `id`
- Logical reference: `trip_id` -> trips.id (service-level)
- Important fields: `amount`, `currency`, `status`, `idempotency_key`, `method`, `reference`, `refund_idempotency_key`, `refunded_at`, `refund_amount`, `created_at`

### Relationships (Logical, not SQL FK constraints)

- One rider can have many trips (`rider_id`)
- One driver can have many trips (`driver_id`)
- One trip can have one or more payment records/events (`trip_id`)

## SQLite Replica Limitation (Explicit Note)

- SQLite is intentionally used for this assignment as a lightweight per-service datastore.
- SQLite has a single-writer concurrency model per DB file, so it is not ideal for write-heavy multi-replica production scaling.
- For Kubernetes deployment, each SQLite-backed service is kept at `replicas: 1` in manifests to avoid multi-writer conflicts on the same DB file.
- Horizontal scale is demonstrated at architecture level (microservices separation, async events, metrics), while persistent write paths remain single-replica for SQLite safety.

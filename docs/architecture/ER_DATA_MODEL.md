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

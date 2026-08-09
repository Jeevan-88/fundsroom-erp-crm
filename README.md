# FundsRoom Mini ERP + CRM

FundsRoom Mini ERP + CRM is an internal web application for a wholesale and distribution business. The backend in this repository provides authentication, customer CRM, product and inventory management, stock movements, and sales challans with transaction-safe stock control.

## Overview

The project is structured as a modular Express + TypeScript API backed by PostgreSQL and Prisma. It uses JWT authentication and role-based authorization for the internal roles `ADMIN`, `SALES`, `WAREHOUSE`, and `ACCOUNTS`.

The backend is currently the completed milestone in this workspace. The frontend work is intentionally left for a later stage.

## Features

- Email/password authentication with JWT
- Role-based authorization
- Customer management and CRM follow-ups
- Product master and inventory visibility
- Stock movement audit trail
- Sales challan creation, update, confirmation, and cancellation
- Negative stock prevention
- Product snapshots stored inside challan items
- REST API responses with consistent JSON shapes
- Automated backend smoke tests

## Architecture

The backend follows a layered structure:

- Route layer for endpoint wiring
- Middleware for authentication and authorization
- Controller layer for HTTP request/response handling
- Service layer for business rules and Prisma access
- PostgreSQL for persistence

See [docs/architecture.md](docs/architecture.md) and [docs/database.md](docs/database.md) for the design notes.

## Technology Stack

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- JWT
- bcryptjs
- Zod

## Project Structure

```text
server/
	prisma/
	src/
		app.ts
		server.ts
		lib/
		middleware/
		modules/
			auth/
			customers/
			products/
			stock/
			challans/
		scripts/
		utils/
docs/
	architecture.md
	assumptions.md
	database.md
	postman/
```

## Database Design

Prisma schema is the source of truth for the database model.

Core entities:

- User
- Customer
- FollowUp
- Product
- StockMovement
- Challan
- ChallanItem

The sales challan model stores product snapshots so confirmed challans keep the historical product name, SKU, and unit price even if the product changes later.

## Authentication

Login is handled through `POST /api/auth/login` with email and password. The API returns a JWT that must be sent in the `Authorization: Bearer <token>` header for protected endpoints.

Seeded login users:

- `admin@fundsroom.local` / `Admin@12345`
- `sales@fundsroom.local` / `Sales@12345`
- `warehouse@fundsroom.local` / `Warehouse@12345`
- `accounts@fundsroom.local` / `Accounts@12345`

## Authorization

Roles used by the API:

- `ADMIN` has full access
- `SALES` can manage customers, follow-ups, and challans, and can view products and stock
- `WAREHOUSE` can view products, manage stock movements, and view inventory and challans
- `ACCOUNTS` can view customers, products, inventory, and challans

## API Documentation

The Postman collection is stored in [docs/postman/fundsroom-mini-erp-crm.postman_collection.json](docs/postman/fundsroom-mini-erp-crm.postman_collection.json).

The matching environment file is stored in [docs/postman/fundsroom-mini-erp-crm.postman_environment.json](docs/postman/fundsroom-mini-erp-crm.postman_environment.json).

The collection covers:

- Authentication
- Customers
- Products
- Stock movements
- Challans

## Environment Variables

Create `server/.env` with:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`

Example values are intentionally not committed. Use your own Neon PostgreSQL connection string and a private JWT secret.

## Local Setup

1. Install dependencies in `server/`.
2. Configure `server/.env`.
3. Run Prisma migrations.
4. Seed the users.
5. Start the backend.

## Database Setup

From `server/`:

```bash
npx prisma migrate dev
npm run seed:user
```

If you need to inspect the generated client or schema after changes, rerun the Prisma commands above.

## Migration Commands

From `server/`:

```bash
npx prisma migrate dev --name <migration-name>
npx prisma generate
```

## Seed Commands

From `server/`:

```bash
npm run seed:user
```

## Development Commands

From `server/`:

```bash
npm run dev
npm run build
npm run start
```

## Testing

From `server/`:

```bash
npm run typecheck
npm test
```

The smoke suite exercises:

- Valid and invalid login
- Missing and invalid bearer tokens
- Admin-only product access
- Customer create, search, get, update, and follow-up flows
- Product create, duplicate SKU rejection, list, search, and update flows
- Stock IN, OUT, insufficient stock rejection, and unchanged stock after failure
- Challan draft creation, update, confirmation, cancellation, stock reduction, and snapshot retention

## Deployment

The backend is deployment-ready in the sense that it uses environment variables, Prisma migrations, and a standard Node.js server entrypoint. No production deployment has been performed in this workspace.

Typical hosting options include Neon for PostgreSQL and a Node.js host such as Render, Railway, or Fly.io.

## Assumptions

- Draft challans are allowed to be updated and cancelled.
- Only draft challans can be confirmed.
- Challan snapshots are captured when the challan is created or updated and are preserved after confirmation.
- Product stock is adjusted through stock movements and challan confirmation, not by editing the stock value directly in the product API.

## Known Limitations

- The frontend/UI is not implemented in this milestone.
- There is no browser-based user flow yet.
- The test suite is a backend smoke suite rather than a full browser automation layer.

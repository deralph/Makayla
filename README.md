# Makayla Jam Backend

NestJS backend for the Makayla Jam game.

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure variables
4. Start MongoDB: `docker-compose up -d`
5. Run the application: `npm run start:dev`

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for device JWT tokens
- `JWT_EXPIRES_IN` - JWT expiration time
- `ADMIN_JWT_SECRET` - Secret for admin JWT tokens
- `ADMIN_JWT_EXPIRES_IN` - Admin JWT expiration time
- `THROTTLE_LIMIT` - Rate limit requests per TTL
- `THROTTLE_TTL` - Rate limit time window in seconds

## Scripts

- `npm run start` - Start production server
- `npm run start:dev` - Start development server with watch mode
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint code
- `npm run format` - Format code
- `npm run seed` - Seed database with sample data
- `npm run backup` - Backup database

## API Documentation

After starting the server, visit http://localhost:3000/api for Swagger documentation.

## Database

The application uses MongoDB with the following collections:

- `users` - Player data and game state
- `transactions` - Coin transaction history
- `items` - Shop items
- `missions` - Mission definitions

## Features

- **Authentication** for device users and admins, with separate JWTs and refresh handling.
- **Player progression** covering coins, energy, multitap upgrades, and mission/social task flows.
- **Economy** with idempotent coin mutations logged to a ledger and consumable shop items.
- **Redeem codes** that can be created by admins, optionally pre-assigned to a user with gift metadata, and require admin confirmation before rewards are applied.
- **Gifting** between users via admin-managed gift records.
- **Tournaments** that cap entries at 10 players, track coins generated during the event, and compute winners from the leaderboard.
- **Notifications** for registering device tokens and dispatching messages from admin tools.
- **Admin console** endpoints for bans, analytics snapshots, and game-configuration storage.

## Architecture

The backend follows a modular structure with separate modules for authentication, users, shop, missions, leaderboard, gifting, redeem codes, tournaments, and notifications. All state-changing operations are idempotent using `opId` to prevent duplicate processing.

### Redeem code lifecycle

1. **Create** – An admin creates a code with rewards, optional expiry/max uses, and optional assignment to a specific user plus gift context.
2. **Confirm** – A user provides the code to an admin, who confirms it via the admin redeem endpoint; only after confirmation are rewards applied and the use recorded.
3. **Audit** – Codes track confirmation status, assignment, and usage history to prevent unauthorized redemption.

### Tournament rules

1. **Enrollment** – Up to 10 players can join an active tournament; additional join attempts are rejected once the cap is reached.
2. **Scoring** – Clients submit coins-generated totals; higher coin totals overwrite a player’s previous best.
3. **Results** – Leaderboards sort by coins generated to surface current placement and winners at event end.

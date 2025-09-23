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

## Architecture

The backend follows a modular structure with separate modules for:

- Authentication (device and admin)
- User management
- Coin transactions
- Shop items
- Missions
- Leaderboard

All state-changing operations are idempotent using `opId` to prevent duplicate processing.

# Prisma Migration Guide

## Overview

This project has been migrated from `better-sqlite3` to Prisma ORM to support multiple database providers:

- **Development**: SQLite (file-based database)
- **Production**: PostgreSQL (configurable)

## Database Configuration

### Environment Variables

#### Development (SQLite)

```env
DATABASE_URL="file:./energy.db"
```

#### Production (PostgreSQL)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/energydb?schema=public"
```

### Switching Providers

To switch between SQLite and PostgreSQL, update `prisma/schema.prisma`:

**For SQLite:**

```prisma
datasource db {
  provider = "sqlite"
}
```

**For PostgreSQL:**

```prisma
datasource db {
  provider = "postgresql"
}
```

After changing providers:

1. Update `DATABASE_URL` in `.env`
2. Run `npm run prisma:generate`
3. Run `npm run prisma:push` or `npm run prisma:migrate`

## npm Scripts

| Script                    | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `npm run prisma:generate` | Generate Prisma Client after schema changes              |
| `npm run prisma:push`     | Push schema changes to database (no migration files)     |
| `npm run prisma:migrate`  | Create and apply migrations (recommended for production) |
| `npm run prisma:studio`   | Open Prisma Studio (database GUI)                        |

## Database Schema

The Prisma schema defines 4 models:

### User

- `id`: Auto-increment primary key
- `username`: Unique username
- `email`: Unique email (nullable for guest users)
- `passwordHash`: Hashed password (nullable for guest users)
- `isGuest`: Boolean flag for guest accounts
- `isAdmin`: Boolean flag for admin privileges
- `createdAt`: Account creation timestamp
- `lastLogin`: Last login timestamp
- Relations: `energyData[]`, `gasData[]`

### EnergyData

- `id`: Auto-increment primary key
- `userId`: Foreign key to User
- `startTime`, `endTime`: Time range strings
- `kwh`: Energy consumption
- `date`, `hour`, `minute`: Time components
- `isDailyTotal`: Flag for aggregated daily data
- `createdAt`: Record creation timestamp
- Indexes: `userId`, `date`, `startTime`, `userId+date`, `isDailyTotal+date`, `hour+minute`

### GasData

- Same structure as EnergyData
- Separate table for gas consumption tracking
- Indexes: `userId`, `date`, `startTime`, `userId+date`, `isDailyTotal+date`, `hour+minute`

### PowerPlan

- `id`: Auto-increment primary key
- `retailer`, `name`: Plan identification
- `active`: Boolean flag for visibility
- `isFlatRate`: Pricing structure flag
- `flatRate`, `peakRate`, `offPeakRate`, `dailyCharge`: Electricity pricing
- `hasGas`: Flag for combined electricity+gas plans
- `gasIsFlatRate`, `gasFlatRate`, `gasPeakRate`, `gasOffPeakRate`, `gasDailyCharge`: Gas pricing
- `createdAt`, `updatedAt`: Timestamps
- Indexes: `retailer`, `active`

## API Changes

### Before (better-sqlite3)

```typescript
// Synchronous operations
const user = getUserById(1);
const plans = listPowerPlans(true);
```

### After (Prisma)

```typescript
// Asynchronous operations with await
const user = await getUserById(1);
const plans = await listPowerPlans(true);
```

**All database operations are now async!** Update all code that calls db functions to use `await`.

## Migration from SQLite to PostgreSQL

### Step 1: Export Data from SQLite

```bash
# Export using Prisma Studio or custom script
npm run prisma:studio
```

### Step 2: Update Configuration

1. Update `DATABASE_URL` in `.env` to PostgreSQL connection string
2. Change provider in `prisma/schema.prisma` to `"postgresql"`
3. Run `npm run prisma:generate`

### Step 3: Create Database Schema

```bash
npm run prisma:migrate
```

### Step 4: Import Data

- Use Prisma seed scripts or custom migration scripts
- Ensure data types are compatible (SQLite INTEGER 0/1 → PostgreSQL BOOLEAN)

## Testing

### Unit Tests

Tests now use `jest-mock-extended` to mock Prisma Client:

```typescript
import { mockDeep } from "jest-mock-extended";
const prismaMock = mockDeep<PrismaClient>();
```

### E2E Tests

E2E tests interact with the real database via API endpoints (no changes required).

Run tests:

```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests
```

## Troubleshooting

### Issue: "PrismaClient is unable to run in the browser"

**Solution**: Make sure `lib/db.ts` uses the singleton pattern:

```typescript
const prisma = globalForPrisma.prisma ?? new PrismaClient();
```

### Issue: Type errors after schema changes

**Solution**: Regenerate Prisma Client:

```bash
npm run prisma:generate
```

### Issue: Database schema out of sync

**Solution**: Push schema changes:

```bash
npm run prisma:push --accept-data-loss  # Development only
npm run prisma:migrate                   # Production
```

### Issue: Better-sqlite3 errors

**Solution**: Ensure all imports reference `@/lib/db` (not `better-sqlite3` directly).

## Backward Compatibility

The `lib/db.ts` file maintains the same function signatures and return types as the old better-sqlite3 implementation:

- Same exported types: `User`, `EnergyRecord`, `GasRecord`, `PowerPlan`
- Same function names and parameters
- Same return data structures (camelCase → snake_case mapping)
- Only difference: all functions are now async (return Promises)

This ensures minimal code changes in the rest of the application.

## Data Type Mappings

### SQLite → Prisma → PostgreSQL

| SQLite           | Prisma Schema | PostgreSQL       |
| ---------------- | ------------- | ---------------- |
| INTEGER          | Int           | INTEGER          |
| REAL             | Float         | DOUBLE PRECISION |
| TEXT             | String        | TEXT / VARCHAR   |
| INTEGER (0/1)    | Boolean       | BOOLEAN          |
| TEXT (timestamp) | DateTime      | TIMESTAMP        |

### Important Notes:

- Prisma automatically handles boolean conversion (SQLite 0/1 ↔ PostgreSQL true/false)
- DateTime fields are stored as ISO strings in SQLite, native timestamps in PostgreSQL
- Null values are handled consistently across both databases

## Production Deployment Checklist

- [ ] Update `DATABASE_URL` environment variable for production PostgreSQL
- [ ] Change `provider` in `prisma/schema.prisma` to `"postgresql"`
- [ ] Run `npm run prisma:generate` in production build
- [ ] Run `npm run prisma:migrate` to create database schema
- [ ] Test all database operations in staging environment
- [ ] Verify indexes are created correctly
- [ ] Set up database backups
- [ ] Monitor query performance
- [ ] Configure connection pooling for production

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Multi-Provider Support](https://www.prisma.io/docs/concepts/database-connectors)

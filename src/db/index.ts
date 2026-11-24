import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.ts'

import { Pool } from 'pg';

// Connection budget: PM2 runs one process per CPU (ecosystem.config.cjs,
// instances: 'max'), and each gets its own pool, so the total is
// (CPU count x DB_POOL_MAX). Keep that under Postgres max_connections minus
// headroom for migrations/psql/backups. Default 8 matches the original sizing
// (6 processes x 8 = 48 < 60).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX) || 8,
  idleTimeoutMillis: 15000, // Close idle connections faster to free up server RAM
  // How long a request waits for a free pooled connection before failing.
  // Kept generous so a burst of voters queues briefly instead of having
  // ballots rejected; 2s was too tight once this pool is actually in use.
  connectionTimeoutMillis: Number(process.env.DB_POOL_TIMEOUT_MS) || 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Previously `drizzle(process.env.DATABASE_URL!, { schema })`, which made
// drizzle build its OWN default pool (max 10, no timeouts) and left the pool
// above completely unused -- so none of the sizing here applied.
export const db = drizzle(pool, { schema });

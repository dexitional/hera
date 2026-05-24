import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.ts'

import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 8, // 6 PM2 processes * 8 = 48 connections. Safe under the 60 max limit.
  idleTimeoutMillis: 15000, // Close idle connections faster to free up server RAM
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Initialize Drizzle ORM
// export const db = drizzle(pool, { schema });
export const db = drizzle(process.env.DATABASE_URL!, { schema })

import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.js'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

export const pool = new pg.Pool({
  connectionString,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client:', err.message)
})

export const db = drizzle(pool, {
  schema,
  logger: process.env.LOG_SQL === 'true',
})

export function pgErrorCode(err: unknown) : string | undefined {
  if (typeof err !== 'object' || err === null) return undefined
  if ('code' in err && typeof err.code === 'string') return err.code
  if ('cause' in err) return pgErrorCode(err.cause)
    return undefined
}
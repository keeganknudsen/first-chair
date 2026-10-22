import pg from 'pg'

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

export function pgErrorCode(err: unknown) : string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    return String(err.code)
  }
  return undefined
}
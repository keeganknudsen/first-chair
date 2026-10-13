import fs from 'node:fs/promises'
import path from 'node:path'
import { pool } from './db.js'

const migrationsDir = path.join(import.meta.dirname, '..', 'migrations')

async function migrate() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name text PRIMARY KEY,
            applied_at timestamptz NOT NULL DEFAULT now()
        ) 
    `)

    const { rows } = await pool.query<{ name: string }>(
        'SELECT name FROM schema_migrations',
    )
    const applied = new Set(rows.map((row) => row.name))

    const files = (await fs.readdir(migrationsDir))
        .filter((file) => file.endsWith('.sql'))
        .sort()

    for (const file of files) {
        if (applied.has(file)) {
            continue
        }

        const sql = await fs.readFile(path.join(migrationsDir, file), 'utf-8')
        const client = await pool.connect()

        try {
            await client.query('BEGIN')
            await client.query(sql)
            await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
            await client.query('COMMIT')
            console.log(`Applied ${file}`)
        } catch (err) {
            await client.query('ROLLBACK')
            throw err
        } finally {
            client.release()
        }
    }

    console.log('Migrations up to date')
}

migrate()
    .catch((err) => {
        console.error('Migration failed:', err)
        process.exitCode = 1
    })
    .finally(() => pool.end())
import express from 'express'
import { pool } from './db.js'

export const app = express()

app.use(express.json())

//Check app health. SELECT 1 is the cheapest query so we can just prove the db is answering.
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, db: 'up' })
  } catch (err) {
    console.error('Health check failed:', err)
    res.status(503).json({ ok: false, db: 'down' })
  }
})
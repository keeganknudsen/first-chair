import express, { ErrorRequestHandler } from 'express'
import cors from 'cors'
import { pool } from './db.js'
import { postsRouter } from './routes/posts.js'

const clientOrigin = process.env.CLIENT_ORIGIN

if (!clientOrigin) {
  throw new Error('CLIENT_ORIGIN is not set')
}

export const app = express()

//Allows one specifc origin. Follows principle of least privilege.
app.use(cors({ origin: clientOrigin }))
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

app.use('/api/posts', postsRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}

app.use(errorHandler)
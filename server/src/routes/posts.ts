import { RequestHandler, Router } from 'express'
import { pgErrorCode, pool } from '../db.js'
import { pathToFileURL } from 'node:url';

export const postsRouter = Router()

type PostSummary = {
    id: string
    title: string
    slug: string
    createdAt: Date
    updatedAt: Date
}

type Post = PostSummary & {
    bodyMd: string
}

const summaryColumns = `
    id, title, slug,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
`

const postColums = `${summaryColumns}, body_md AS "bodyMd"`

const requireWritesEnabled: RequestHandler = (_req, res, next) => {
    if (process.env.ENABLE_WRITES !== 'true') {
        res.status(403).json({ error: 'Writes are disabled' })
        return
    }
    next()
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0
}

postsRouter.get('/', async (_req, res) => {
    const { rows } = await pool.query<PostSummary>(
        `SELECT ${summaryColumns} FROM posts ORDER BY created_at DESC`,
    )
    res.json({ posts: rows })
})

postsRouter.get('/:slug', async (req, res) => {
    const { rows } = await pool.query<Post>(
        `SELECT ${postColums} FROM posts WHERE slug = $1`,
        [req.params.slug],
    )

    const post = rows[0]

    if (!post) {
        res.status(404).json({ error: 'Post not found' })
        return
    }

    res.json({ post })
})

postsRouter.post('/', requireWritesEnabled, async (req, res) => {
    const { title, slug, bodyMd } = req.body ?? {}

    if(!isNonEmptyString(title) || !isNonEmptyString(slug) || !isNonEmptyString(bodyMd)) {
        res.status(400).json({ error: 'title, slug, and bodyMd are required'})
        return
    }

    try {
        const { rows } = await pool.query<Post>(
            `INSERT INTO posts (title, slug, body_md)
             VALUES ($1, $2, $3)
             RETURNING ${postColums}`,
            [title, slug, bodyMd],
        )
        const post = rows[0]
        res.status(201).location(`/api/posts/${post.slug}`).json({ post })
    } catch (err) {
        const code = pgErrorCode(err)
        if (code === '23505') {
            res.status(409).json({ error: 'A post with that slug already exists' })
            return
        }
        if (code === '23514') {
            res.status(400).json({ error: 'Glug must be lowercase letters, numbers, and hyphens'})
            return
        }
        throw err
    }
})

postsRouter.patch('/:slug', requireWritesEnabled, async (req, res) => {
    const { title, slug, bodyMd } = req.body ?? {}
    const fields = { title, slug, bodyMd }

    const provided = Object.values(fields).filter((value) => value !== undefined)
    if (provided.length === 0) {
        res.status(400).json({ error: 'Provide at least one of title, slug, or bodyMd'})
        return
    }
    if (provided.some((value) => !isNonEmptyString(value))) {
        res.status(400).json({ error: 'Fields must be non-empty strings' })
        return
    }

    try {
        const { rows } = await pool.query<Post>(
            `UPDATE posts
             SET title = COALESCE($1, title),
                 slug = COALESCE($2, slug),
                 body_md = COALESCE($3, body_md),
                 updated_at = now()
             WHERE slug = $4
             RETURNING ${postColums}`,
            [title, slug, bodyMd, req.params.slug],
        )
        const post = rows[0]
        if(!post) {
            res.status(404).json({ error: 'Post not found' })
            return
        }
        res.json({ post })
    } catch (err) {
        const code = pgErrorCode(err)
        if (code === '23505') {
            res.status(409).json({ error: 'A post with that slug already exists' })
            return
        }
        if (code === '23514') {
            res.status(400).json({ error: 'Glug must be lowercase letters, numbers, and hyphens'})
            return
        }
        throw err
    }
})

postsRouter.delete('/:slug', requireWritesEnabled, async (req, res) => {
    const result = await pool.query('DELETE FROM posts WHERE slug = $1', [req.params.slug])
    if (result.rowCount === 0) {
        res.status(404).json({ error: 'Post not found' })
        return
    }
    res.status(204).end()
})


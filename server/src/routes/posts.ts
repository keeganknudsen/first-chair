import { Router } from 'express'
import { pool } from '../db.js'

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

postsRouter.get('/', async (_req, res) => {
    const { rows } = await pool.query<PostSummary>(`
        SELECT id, title, slug,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        FROM posts
        ORDER BY created_at DESC
    `)

    res.json({ posts: rows })
})

postsRouter.get('/:slug', async (req, res) => {
    const { rows } = await pool.query<Post>(
        `
        
        SELECT id, title, slug,
            body_md AS "bodyMd",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
        FROM posts
        WHERE slug = $1
        `,
        [req.params.slug],
    )

    const post = rows[0]

    if (!post) {
        res.status(404).json({ error: 'Post not found' })
        return
    }

    res.json({ post })
})
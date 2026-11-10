import { Router, type RequestHandler, type Response } from 'express'
import { z } from 'zod'
import { desc, eq, sql } from 'drizzle-orm'
import { db, pgErrorCode} from '../db.js'
import { posts, type PostRow } from '../schema.js'
import { 
    createPostSchema,
    slugify,
    SLUG_MAX_LENGTH, 
    updatePostSchema 
} from '@first-chair/shared'


export const postsRouter = Router()

const summaryFields = {
    id: posts.id,
    title: posts.title,
    slug: posts.slug,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
}

const requireWritesEnabled: RequestHandler = (_req, res, next) => {
    if (process.env.ENABLE_WRITES !== 'true') {
        res.status(403).json({ error: 'Writes are disabled' })
        return
    }
    next()
}

function sendValidationError(res: Response, error: z.ZodError) {
    res.status(400).json({
        error: 'Invalid request',
        fields: z.flattenError(error).fieldErrors,
    })
}

function handleWriteError(err: unknown, res: Response): boolean {
    const code = pgErrorCode(err)
    if (code === '23505') {
        res.status(409).json({ error: 'A post with that slug already exists' })
        return true
    }
    if (code === '23514') {
        res.status(400).json({ error: 'Glug must be lowercase letters, numbers, and hyphens'})
        return true
    }
    return false
}

async function insertPost(title: string, slug: string, bodyMd: string): Promise<PostRow> {
    const [post] = await db.insert(posts).values({ title, slug, bodyMd }).returning()
    return post
}

function withSuffix(base: string, n: number): string {
    const suffix = `-${n}`
    return base.slice(0, SLUG_MAX_LENGTH - suffix.length).replace(/-+$/, '') + suffix
}

postsRouter.get('/', async (_req, res) => {
    const rows = await db
        .select(summaryFields)
        .from(posts)
        .orderBy(desc(posts.createdAt))
    res.json({ posts: rows })
})

postsRouter.get('/:slug', async (req, res) => {
    const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.slug, req.params.slug))
        .limit(1)

    if (!post) {
        res.status(404).json({ error: 'Post not found' })
        return
    }

    res.json({ post })
})

const MAX_SLUG_ATTEMPTS = 20

postsRouter.post('/', requireWritesEnabled, async (req, res) => {
    const parsed = createPostSchema.safeParse(req.body)
    if (!parsed.success) {
        sendValidationError(res, parsed.error)
        return
    }
    const { title, slug, bodyMd } = parsed.data

    if (slug) {
        try {
            const post = await insertPost(title, slug, bodyMd)
            res.status(201).location(`/api/posts/${post.slug}`).json({ post })
        } catch (err) {
            if (!handleWriteError(err, res)) throw err
        }
        return
    }

    const base = slugify(title) || 'post'

    for (let n = 1; n <= MAX_SLUG_ATTEMPTS; n++) {
        const candidate = n === 1 ? base : withSuffix(base, n)
        try {
            const post = await insertPost(title, candidate, bodyMd)
            res.status(201).location(`/api/posts/${post.slug}`).json({ post })
            return
        } catch (err) {
            if (pgErrorCode(err) === '23505') {
                continue
            }
            if (!handleWriteError(err, res)) {
                throw err
            }
            return
        }
    }

    res.status(409).json({ error: 'Could not find a free slug for that title' })
})

postsRouter.patch<{ slug: string }>('/:slug', requireWritesEnabled, async (req, res) => {
    const parsed = updatePostSchema.safeParse(req.body)
    if (!parsed.success) {
        sendValidationError(res, parsed.error)
        return
    }
    const { title, slug, bodyMd } = parsed.data

    try {
        const [post] = await db
            .update(posts)
            .set({ title, slug, bodyMd, updatedAt: sql`now()` })
            .where(eq(posts.slug, req.params.slug))
            .returning()

        if(!post) {
            res.status(404).json({ error: 'Post not found' })
            return
        }
        res.json({ post })
    } catch (err) {
        if (!handleWriteError(err, res)) {
            throw err
        }
    }
})

postsRouter.delete<{ slug: string }>('/:slug', requireWritesEnabled, async (req, res) => {
    const deleted = await db
        .delete(posts)
        .where(eq(posts.slug, req.params.slug))
        .returning({ id: posts.id })

    if (deleted.length === 0) {
        res.status(404).json({ error: 'Post not found' })
        return
    }
    res.status(204).end()
})


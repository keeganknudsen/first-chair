import {
    postListResponseSchema,
    postResponseSchema,
    type CreatePostInput,
    type Post,
    type PostSummary,
    type UpdatePostInput,
} from '@first-chair/shared'


const API_URL = import.meta.env.VITE_API_URL

export type { Post, PostSummary }

export async function getPosts(signal?: AbortSignal): Promise<PostSummary[]> {
    const res = await fetch(`${API_URL}/api/posts`, { signal })
    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
    }
    const data = postListResponseSchema.parse(await res.json())
    return data.posts
}

export async function getPost(slug: string, signal?: AbortSignal): Promise<Post | null> {
    const res = await fetch(`${API_URL}/api/posts/${encodeURIComponent(slug)}`, { signal })
    if (res.status === 404) {
        return null
    }
    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
    }
    const data = postResponseSchema.parse(await res.json())
    return data.post
}

export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day : 'numeric',
        timeZone: 'UTC',
    })
}

export type FieldErrors = Partial<Record<keyof CreatePostInput, string[]>>

export class ApiError extends Error {
    status: number
    fields: FieldErrors

    constructor(status: number, message: string, fields: FieldErrors = {}) {
        super(message)
        this.status = status
        this.fields = fields
    }
}

async function sendPost(url: string, method: 'POST' | 'PATCH', body: unknown): Promise<Post> {
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

    const data: unknown = await res.json().catch(() => null)

    if (!res.ok) {
        const err = data as { error?: string; fields?: FieldErrors } | null
        throw new ApiError(res.status, err?.error ?? `Request failed: ${res.status}`, err?.fields ?? {})
    }

    return postResponseSchema.parse(data).post
}

export function createPost(input: CreatePostInput): Promise<Post> {
    return sendPost(`${API_URL}/api/posts`, 'POST', input)
}

export function updatePost(slug: string, input: UpdatePostInput): Promise<Post> {
    return sendPost(`${API_URL}/api/posts/${encodeURIComponent(slug)}`, 'PATCH', input)
}
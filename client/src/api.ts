const API_URL = import.meta.env.VITE_API_URL

export type PostSummary = {
    id: string
    title: string
    slug: string
    createdAt: string
    updatedAt: string
}

export type Post = PostSummary & {
    bodyMd: string
}

export async function getPosts(signal?: AbortSignal): Promise<PostSummary[]> {
    const res = await fetch(`${API_URL}/api/posts`, { signal })
    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
    }
    const data = (await res.json()) as { posts: PostSummary[] }
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
    const data = (await res.json()) as { post: Post }
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
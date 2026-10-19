import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { formatDate, getPost, type Post } from '../api'

type State = 
    | { state: 'loading' }
    | { state: 'loaded', post: Post }
    | { state: 'not-found' }
    | { state: 'error' }

export function PostPage() {
    const { slug } = useParams<{ slug: string }>()
    const [status, setStatus] = useState<State>({ state: 'loading'})

    useEffect(() => {
        if (!slug) {
            return
        }
        const controller = new AbortController()
        setStatus({ state: 'loading' })

        getPost(slug, controller.signal)
            .then((post) =>
                setStatus(post ? { state: 'loaded' , post } : { state: 'not-found' }),
            )
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setStatus({ state: 'error' })
                }
            })
        
            return () => controller.abort()
    }, [slug])

    if (status.state === 'loading') {
        return <p>Loading posts...</p>
    }

    if (status.state == 'not-found') {
        return <p>That post doesn't exist.</p>
    }

    if (status.state === 'error') {
        return <p>Couldn't load posts.</p>
    }

    const { post } = status

    return (
        <article>
            <Link to="/">Back to all posts</Link>
            <h2>{post.title}</h2>
            <p>{formatDate(post.createdAt)}</p>
            <div style={{ whiteSpace: 'pre-wrap' }}>{post.bodyMd}</div>
        </article>
    )
}
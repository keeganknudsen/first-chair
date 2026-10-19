import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { formatDate, getPosts, type PostSummary } from '../api'

type State = 
    | { state: 'loading' }
    | { state: 'loaded'; posts: PostSummary[] }
    | { state: 'error' }

export function PostListPage() {
    const [status, setStatus] = useState<State>({ state: 'loading' })

    useEffect(() => {
        const controller = new AbortController()

        getPosts(controller.signal)
            .then((posts) => setStatus({ state: 'loaded', posts }))
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setStatus({ state: 'error'})
                }
            })
        
            return () => controller.abort()
    }, [])

    if (status.state === 'loading') {
        return <p>Loading posts...</p>
    }

    if (status.state === 'error') {
        return <p>Couldn't load posts.</p>
    }

    return (
        <ul>
            {status.posts.map((post) => (
                <li key={post.slug}>
                    <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                    <span> {formatDate(post.createdAt)}</span>
                </li>
            ))}
        </ul>
    )
}
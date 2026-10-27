import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { formatDate, getPosts, type PostSummary } from '../api'
import { Loading } from '../components/Loading'
import { ErrorMessage } from '../components/ErrorMessage'

type State = 
    | { state: 'loading' }
    | { state: 'loaded'; posts: PostSummary[] }
    | { state: 'error' }

export function PostListPage() {
    const [status, setStatus] = useState<State>({ state: 'loading' })
    const [attempt, setAttempt] = useState(0)

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
    }, [attempt])

    function retry() {
        setStatus({ state: 'loading' })
        setAttempt((n) => n + 1)
    }

    if (status.state === 'loading') {
        return <Loading message="Loading posts..." />
    }

    if (status.state === 'error') {
        return <ErrorMessage message="Couldn't load posts." onRetry={retry} />
    }

    if (status.posts.length === 0) {
        return (
            <div>
                <p>No posts yet.</p>
                {import.meta.env.DEV && <Link to="/new">Write the first post</Link>}
            </div>
        )
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
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import Markdown from 'react-markdown'
import { formatDate, getPost, type Post } from '../api'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'

type State = 
    | { state: 'loading' }
    | { state: 'loaded', post: Post }
    | { state: 'not-found' }
    | { state: 'error' }

export function PostPage() {
    const { slug } = useParams<{ slug: string }>()
    const [status, setStatus] = useState<State>({ state: 'loading'})
    const [attempt, setAttempt] = useState(0)

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
                    console.error(err)
                    setStatus({ state: 'error' })
                }
            })
        
            return () => controller.abort()
    }, [slug, attempt])

    function retry() {
        setStatus({ state: 'loading' })
        setAttempt((n) => n + 1)
    }

    if (status.state === 'loading') {
        return <Loading />
    }

    if (status.state == 'not-found') {
        return <ErrorMessage message="Couldn't load this post." onRetry={retry} />
    }

    if (status.state === 'error') {
        return <p>Couldn't load posts.</p>
    }

    const { post } = status

    return (
        <article>
            <Link to="/">Back to all posts</Link>
            <h2>{post.title}</h2>
            {import.meta.env.DEV && <Link to={`/posts/${post.slug}/edit`}>Edit</Link>}
            <p>{formatDate(post.createdAt)}</p>
            <div className="post-body">
                <Markdown>{post.bodyMd}</Markdown>
            </div>
        </article>
    )
}
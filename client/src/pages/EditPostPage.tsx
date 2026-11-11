import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getPost, updatePost, type Post } from '../api'
import { NotFound } from '../components/NotFound'
import { PostForm } from '../components/PostForm'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'

type State = 
    | { state: 'loading' }
    | { state: 'loaded'; post: Post }
    | { state: 'not-found' }
    | { state: 'error' }

export function EditPostPage() {
    const { slug }= useParams<{ slug: string }>()
    const navigate = useNavigate()
    const [status, setStatus] = useState<State>({ state: 'loading' })
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        if (!slug) {
            return
        }
        const controller = new AbortController()
        setStatus({ state: 'loading' })

        getPost(slug, controller.signal)
            .then((post) => 
                setStatus(post ? { state: 'loaded', post} : { state: 'not-found' }),
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

    if (status.state === 'loading') return <Loading />
    if (status.state === 'not-found') return <NotFound message="That post doesn't exist." />
    if (status.state === 'error') return <ErrorMessage message="Couldn't load this post." onRetry={retry} />

    const { post } = status

    return (
        <div>
            <h2>Edit post</h2>
            <PostForm
                initial={{ title: post.title, slug: post.slug, bodyMd: post.bodyMd }}
                submitLabel="Save changes"
                onSubmit={async (input) => {
                    const updated = await updatePost(post.slug, input)
                    navigate(`/posts/${updated.slug}`)
                }}
            />
        </div>
    )
}
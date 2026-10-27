import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getPost, updatePost, type Post } from '../api'
import { NotFound } from '../components/NotFound'
import { PostForm } from '../components/PostForm'

type State = 
    | { state: 'loading' }
    | { state: 'loaded'; post: Post }
    | { state: 'not-found' }
    | { state: 'error' }

export function EditPostPage() {
    const { slug }= useParams<{ slug: string }>()
    const navigate = useNavigate()
    const [status, setStatus] = useState<State>({ state: 'loading' })

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
                    setStatus({ state: 'error' })
                }
            })

        return () => controller.abort()
    }, [slug])

    if (status.state === 'loading') return <p>Loading...</p>
    if (status.state === 'not-found') return <NotFound message="That post doesn't exist." />
    if (status.state === 'error') return <p>Couldn't load this post</p>

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
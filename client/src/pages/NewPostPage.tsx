import { useNavigate } from 'react-router'
import { createPost } from '../api'
import { PostForm } from '../components/PostForm'

export function NewPostPage() {
    const navigate = useNavigate()

    return (
        <div>
            <h2>New Post</h2>
            <PostForm 
                submitLabel="Publish"
                onSubmit={async (input) => {
                    const post = await createPost(input)
                    navigate(`/posts/${post.slug}`)
                }}
            />
        </div>
    )
}
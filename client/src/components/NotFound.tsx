import { Link } from 'react-router'

type Props = {
    message?: string
}

export function NotFound({ message = "This page doesn't exist." }: Props) {
    return (
        <div>
            <h2>Not found</h2>
            <p>{message}</p>
            <Link to="/">Back to all posts</Link>
        </div>
    )
}
type Props = {
    message: string
    onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: Props) {
    return (
        <div role="alert">
            <p>{message}</p>
            {onRetry && (
                <button type="button" onClick={onRetry}>
                    Try Again
                </button>
            )}
        </div>
    )
}
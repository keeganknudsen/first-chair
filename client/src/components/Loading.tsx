import { useEffect, useState } from 'react'

type Props = {
  message?: string
}

export function Loading({ message = 'Loading...' }: Props) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div role="status">
      <p>{message}</p>
      {slow && (
        <p className="muted">
          Still working. The server may be waking up, which can take up to a minute.
        </p>
      )}
    </div>
  )
}
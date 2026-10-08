import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

type Health = { ok: boolean; db: 'up' | 'down' }

type Status = 
  | { state: 'loading' }
  | { state: 'loaded'; health: Health }
  | { state: 'unreachable' }

function App() {
  const [status, setStatus] = useState<Status>({ state: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    fetch(`${API_URL}/health`, { signal: controller.signal })
      .then((res) => res.json() as Promise<Health>)
      .then((health) => setStatus({ state: 'loaded', health }))
      .catch((err) => {
        if (err.name !== 'AbortError') setStatus({ state: 'unreachable' })
      })

    return () => controller.abort()
  }, [])

  return (
    <main>
      <h1>First Chair</h1>
      {status.state === 'loading' && <p>Checking the API...</p>}
      {status.state === 'unreachable' && <p>Can't reach the API.</p>}
      {status.state === 'loaded' && (
        <p>
          API {status.health.ok ? 'healthy' : 'degraded'}, database {status.health.db}
        </p>
      )}
    </main>

  )
}

export default App

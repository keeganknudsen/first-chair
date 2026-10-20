import { Link, Route, Routes } from 'react-router'
import { PostListPage } from './pages/PostListPage'
import { PostPage } from './pages/PostPage'
import { NotFound } from './components/NotFound'

function App() {
  return (
    <main>
      <header>
        <h1>
          <Link to="/">First Chair</Link>
        </h1>
      </header>
      <Routes>
        <Route path="/" element={<PostListPage />} />
        <Route path="/posts/:slug" element={<PostPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  )
}

export default App
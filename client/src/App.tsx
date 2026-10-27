import { Link, Route, Routes } from 'react-router'
import { PostListPage } from './pages/PostListPage'
import { PostPage } from './pages/PostPage'
import { NotFound } from './components/NotFound'
import { NewPostPage} from './pages/NewPostPage'
import { EditPostPage} from './pages/EditPostPage'

function App() {
  return (
    <main>
      <header>
        <h1>
          <Link to="/">First Chair</Link>
        </h1>
        {import.meta.env.DEV && <Link to="/new">New post</Link>}
      </header>
      <Routes>
        <Route path="/" element={<PostListPage />} />
        <Route path="/new" element={<NewPostPage />} />
        <Route path="/posts/:slug" element={<PostPage />} />
        <Route path="/posts/:slug/edit" element={<EditPostPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  )
}

export default App
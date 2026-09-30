import React from 'react'
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'
import Downloader from './downloader'
import Uploader from './uploader'
import Footer from './Footer'
import Header from './Header'

// Shared links use a short path, to keep them readable
const ShortLinkRedirect: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  return <Navigate to={`/download/${roomId}/`} replace />
}

const App: React.FC = () => (
  <Router>
    <Header />
    <main>
      <Routes>
        <Route path="/" element={<Uploader />} />
        <Route path="/download/:roomId/" element={<Downloader />} />
        <Route path="/d/:roomId/" element={<ShortLinkRedirect />} />
      </Routes>
    </main>
    <Footer />
  </Router>
)
export default App

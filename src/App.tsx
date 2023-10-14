import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Downloader from './downloader'
import Uploader from './uploader'
import Footer from './Footer'
import Header from './Header'

const App: React.FC = () => (
  <Router>
    <Header />
    <main>
      <Routes>
        <Route path="/" element={<Uploader />} />
        <Route path="/download/:id/" element={<Downloader />} />
      </Routes>
    </main>
    <Footer />
  </Router>
)
export default App

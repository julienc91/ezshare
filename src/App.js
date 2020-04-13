import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import Downloader from './downloader'
import Uploader from './uploader'
import './App.scss'
import Footer from './Footer'
import Header from './Header'

const App = () => (
  <Router>
    <Header />
    <main>
      <Switch>
        <Route exact path='/' component={Uploader} />
        <Route path='/download/:id/' component={Downloader} />
      </Switch>
    </main>
    <Footer />
  </Router>
)

export default App

import React from 'react'
import { Link } from 'react-router-dom'

const Header = () => (
  <header>
    <Link to='/' className='logo'>
      <i className='far fa-share-alt' />
      <h1>ezshare</h1>
    </Link>
  </header>
)

export default Header

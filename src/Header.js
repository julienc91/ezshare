import React from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShareAlt } from '@fortawesome/pro-regular-svg-icons'

const Header = () => (
  <header>
    <Link to='/' className='logo'>
      <FontAwesomeIcon icon={faShareAlt} />
      <h1>ezshare</h1>
    </Link>
  </header>
)

export default Header

import React from 'react'
import { Link } from 'react-router-dom'
import { faShareAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Header: React.FC = () => (
  <header>
    <Link to="/" className="logo">
      <FontAwesomeIcon icon={faShareAlt} />
      <h1>ezshare</h1>
    </Link>
  </header>
)

export default Header

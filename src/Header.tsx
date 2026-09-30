import React from 'react'
import { Link } from 'react-router-dom'
import { faShareAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DarkModeSwitcher from './DarkModeSwitcher.tsx'

const Header: React.FC = () => (
  <header>
    <Link to="/" className="logo">
      <span className="logo-badge">
        <FontAwesomeIcon icon={faShareAlt} />
      </span>
      ezshare
    </Link>
    <DarkModeSwitcher />
  </header>
)

export default Header

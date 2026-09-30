import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

const Footer: React.FC = () => (
  <footer>
    <div>
      ezshare by <a href="https://github.com/julienc91">Julien Chaumont</a>
    </div>
    <a
      className="icon-button"
      href="https://github.com/julienc91/ezshare"
      title="See on GitHub"
      aria-label="ezshare on GitHub"
    >
      <FontAwesomeIcon icon={faGithub} />
    </a>
  </footer>
)

export default Footer

import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

const Footer: React.FC = () => (
  <footer>
    <div>
      ezshare by <a href="https://github.com/julienc91">Julien Chaumont</a>
    </div>
    <div>
      <FontAwesomeIcon icon={faGithub} />
      <a href="https://github.com/julienc91/ezshare">See on GitHub</a>
    </div>
  </footer>
)

export default Footer

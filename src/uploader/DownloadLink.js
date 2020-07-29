import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faCopy } from '@fortawesome/pro-regular-svg-icons'

class DownloadLink extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      copied: false
    }

    this.handleCopy = this.handleCopy.bind(this)
  }

  handleCopy () {
    const { url } = this.props
    navigator.clipboard.writeText(url).then(() => {
      this.setState({ copied: true }, () => {
        setTimeout(() => {
          this.setState({ copied: false })
        }, 2000)
      })
    })
  }

  render () {
    const { id, url } = this.props
    const { copied } = this.state
    return (
      <section className='download-link'>
        <p>This link will be valid as long as your tab is open.</p>
        <pre>
          <a href={url} target='_blank' rel='noopener noreferrer'>{id}</a>
          {copied
            ? <FontAwesomeIcon icon={faCheck} />
            : <FontAwesomeIcon icon={faCopy} onClick={this.handleCopy} />}
        </pre>
      </section>
    )
  }
}

export default DownloadLink

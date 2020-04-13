import React from 'react'

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
          <i className={copied ? 'far fa-check' : 'far fa-copy'} onClick={copied ? undefined : this.handleCopy} />
        </pre>
      </section>
    )
  }
}

export default DownloadLink

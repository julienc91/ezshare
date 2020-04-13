import React from 'react'
import WebrtcClient from './WebrtcClient'

class Downloader extends React.Component {
  render () {
    const { id } = this.props.match.params
    return (
      <WebrtcClient id={id} />
    )
  }
}

export default Downloader

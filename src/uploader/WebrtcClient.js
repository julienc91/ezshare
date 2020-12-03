import React from 'react'
import Peer from 'peerjs'
import { faExclamationCircle, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DownloadLink from './DownloadLink'
import PeerList from './PeerList'
import * as constants from '../constants'

export default class WebrtcClient extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      clientStatus: constants.CLIENT_STATUS_OPENING,
      peers: [],
      id: null
    }

    this.client = null
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this)
    this.handleRefresh = this.handleRefresh.bind(this)
  }

  componentDidMount () {
    window.addEventListener('beforeunload', this.handleBeforeUnload)

    this.client = new Peer({
      host: '/',
      port: 9000
    })
    this.client.on('open', id => {
      this.setState({ id, clientStatus: constants.CLIENT_STATUS_OPEN })
    })
    this.client.on('close', () => {
      this.setState({ clientStatus: constants.CLIENT_STATUS_CLOSE })
    })
    this.client.on('error', () => {
      this.setState({ clientStatus: constants.CLIENT_STATUS_ERROR })
    })
    this.client.on('connection', peer => {
      peer.on('open', () => {
        this.handleNewPeer(peer)
      })
    })
  }

  componentWillUnmount () {
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    this.client && this.client.destroy()
  }

  handleBeforeUnload (e) {
    const { peers } = this.state
    if (peers.length > 0) {
      const message = 'Are you sure? Your link will be lost'
      e.preventDefault()
      e.returnValue = message
      return message
    }
  }

  handleRefresh () {
    document.location.reload(true)
  }

  handleNewPeer (peer) {
    const { peers } = this.state
    this.setState({ peers: [...peers, peer] })
  }

  render () {
    const { id, clientStatus, peers } = this.state
    const { file, password } = this.props

    const url = new URL(`/download/${id}/`, document.baseURI).href
    return (
      <>
        {id && (
          <>
            <DownloadLink id={id} url={url} />
            <PeerList file={file} password={password} peers={peers} />
          </>
        )}
        {!id && clientStatus === constants.CLIENT_STATUS_OPENING && (
          <>
            <div><FontAwesomeIcon icon={faSpinner} /></div>
            <div>Waiting to establish a connection with the server</div>
          </>
        )}
        {!id && clientStatus !== constants.CLIENT_STATUS_OPENING && (
          <>
            <div><FontAwesomeIcon icon={faExclamationCircle} /></div>
            <div>Could not establish a connection to the server.</div>
            <div><button className='default-button' onClick={this.handleRefresh}>Try again</button></div>
          </>
        )}
      </>
    )
  }
}

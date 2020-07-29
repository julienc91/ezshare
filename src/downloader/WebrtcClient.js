import React from 'react'
import Peer from 'peerjs'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinnerThird, faSave } from '@fortawesome/pro-solid-svg-icons'
import * as constants from '../constants'
import { formatSize, getFileIcon, splitFileExtension } from '../utils'

export default class WebrtcClient extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      clientStatus: constants.CLIENT_STATUS_OPENING,
      connStatus: constants.CONN_STATUS_OPENING,
      processStep: constants.PROCESS_STEP_CONNECTED,

      fileInfo: null,

      chunks: [],
      url: null,
      downloadedSize: 0
    }

    this.client = null
    this.conn = null

    this.link = React.createRef()

    this.handleReceiveData = this.handleReceiveData.bind(this)
    this.handleStart = this.handleStart.bind(this)
  }

  componentDidMount () {
    const { id } = this.props
    this.client = new Peer({
      host: '/',
      port: 9000
    })
    this.client.on('open', () => {
      this.setState({ clientStatus: constants.CLIENT_STATUS_OPEN })
      this.conn = this.client.connect(id)
      this.conn.on('open', () => {
        this.setState({ connStatus: constants.CONN_STATUS_OPEN })
        this.conn.on('data', this.handleReceiveData)
        this.conn.on('close', () => {
          this.setState({ connStatus: constants.CONN_STATUS_CLOSE })
        })
        this.conn.on('error', () => {
          this.setState({ connStatus: constants.CONN_STATUS_ERROR })
        })
      })
    })
    this.client.on('close', () => {
      this.setState({ clientStatus: constants.CLIENT_STATUS_CLOSE })
    })
    this.client.on('error', () => {
      this.setState({ clientStatus: constants.CLIENT_STATUS_ERROR })
    })
  }

  componentWillUnmount () {
    this.client && this.client.destroy()
  }

  handleStart () {
    const { processStep } = this.state
    if (processStep !== constants.PROCESS_STEP_INFO) {
      return
    }
    this.setState({ processStep: constants.PROCESS_STEP_CHUNK }, () => {
      this.conn.send({ type: `${constants.PROCESS_STEP_INFO}-ack` })
    })
  }

  handleReceiveData (data) {
    if (data.type === constants.PROCESS_STEP_INIT) {
      this.setState({
        processStep: constants.PROCESS_STEP_INIT
      }, () => {
        this.conn.send({ type: `${constants.PROCESS_STEP_INIT}-ack` })
      })
    } else if (data.type === constants.PROCESS_STEP_INFO) {
      this.setState({
        processStep: constants.PROCESS_STEP_INFO,
        fileInfo: {
          size: data.filesize,
          name: data.filename,
          type: data.filetype,
          chunks: data.chunks
        }
      })
    } else if (data.type === constants.PROCESS_STEP_CHUNK) {
      const chunk = data.chunk
      this.setState({
        chunks: [...this.state.chunks, new Blob([chunk])],
        downloadedSize: this.state.downloadedSize + chunk.byteLength
      }, () => {
        const { chunks, fileInfo } = this.state
        this.conn.send({ type: 'chunk-ack' })
        if (chunks.length === fileInfo.chunks) {
          const blob = new Blob(chunks, { type: fileInfo.type })
          const url = URL.createObjectURL(blob)
          this.setState({ processStep: constants.PROCESS_STEP_COMPLETE, url }, () => {
            this.link && this.link.current && this.link.current.click()
          })
        }
      })
    }
  }

  renderNotConnected () {
    return (
      <section>
        <h1>Waiting for connection</h1>
        <div>
          <FontAwesomeIcon className='loading-icon' icon={faSpinnerThird} />
        </div>
        <div>
          <p>We're waiting for the uploader to establish the connection.</p>
          <p>If this is taking too long, make sure your link is still valid.</p>
        </div>
      </section>
    )
  }

  renderConnected () {
    const { fileInfo, processStep } = this.state
    if (processStep === constants.PROCESS_STEP_CONNECTED || processStep === constants.PROCESS_STEP_INIT) {
      return (
        <section>
          <h1>Connected</h1>
          <div>
            <FontAwesomeIcon className='loading-icon' icon={faSpinnerThird} />
          </div>
          <div>
            <p>The connection was established.</p>
            <p>We're waiting for the uploader to approve your download.</p>
          </div>
        </section>
      )
    }

    const { downloadedSize, url } = this.state

    const [filename, extension] = splitFileExtension(fileInfo.name)
    const fileIcon = getFileIcon(fileInfo.type)
    let progress = 0
    if (processStep === constants.PROCESS_STEP_COMPLETE) {
      progress = 100
    } else if (fileInfo.size > 0) {
      progress = downloadedSize * 100 / fileInfo.size
    }

    return (
      <section>
        <h1>
          {processStep === constants.PROCESS_STEP_CONNECTED && <>Establishing a connection</>}
          {processStep === constants.PROCESS_STEP_INIT && <>Waiting for approval</>}
          {processStep === constants.PROCESS_STEP_INFO && <>Ready to download</>}
          {processStep === constants.PROCESS_STEP_CHUNK && <>Downloading</>}
          {processStep === constants.PROCESS_STEP_COMPLETE && <>Download complete</>}
        </h1>
        <div>
          <div className='uploaded-file'>
            <FontAwesomeIcon className='file-icon' icon={fileIcon} />
            <span className='file-name'>{filename}</span>
            <span className='file-extension'>{extension}</span>
            <span className='file-size'>{formatSize(fileInfo.size)}</span>
          </div>
          {processStep === constants.PROCESS_STEP_INFO && (
            <div>
              <button className='default-button' onClick={this.handleStart}>Download</button>
            </div>
          )}
          {processStep === constants.PROCESS_STEP_CHUNK && (
            <div className='progress'>
              <div className='progress-inner' style={{ width: `${progress}%` }} />
              <label>{Math.round(progress * 100) / 100}%</label>
            </div>
          )}
          {processStep === constants.PROCESS_STEP_COMPLETE && (
            <div>
              <p>Click the link below to save the file on your computer.</p>
              <div className='save-link'>
                <FontAwesomeIcon icon={faSave} />
                <a href={url} target='_blank' rel='noopener noreferrer' download={fileInfo.name} ref={this.link}>
                  {fileInfo.name}
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    )
  }

  renderDisconnected () {
    return (
      <section>
        <h1>Disconnected</h1>
        <div>
          <p>The connection was lost.</p>
        </div>
      </section>
    )
  }

  render () {
    const { connStatus, processStep } = this.state

    if (processStep === constants.PROCESS_STEP_COMPLETE) {
      return this.renderConnected()
    }

    switch (connStatus) {
      case constants.CONN_STATUS_OPENING:
        return this.renderNotConnected()
      case constants.CONN_STATUS_OPEN:
        return this.renderConnected()
      case constants.CONN_STATUS_CLOSE:
      case constants.CONN_STATUS_ERROR:
        return this.renderDisconnected()
      default:
        return null
    }
  }
}

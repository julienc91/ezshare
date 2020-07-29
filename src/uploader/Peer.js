import React from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinnerThird, faUser, faUserCheck, faUserSlash } from '@fortawesome/pro-solid-svg-icons'
import * as constants from '../constants'

const CHUNK_SIZE = 1024 * 1024

export default class Peer extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      status: constants.CONN_STATUS_OPEN,
      start: false,
      chunkNumber: 0,
      step: constants.PROCESS_STEP_CONNECTED
    }

    this.totalChunks = Math.ceil(props.file.size / CHUNK_SIZE) || 1

    this.handleStart = this.handleStart.bind(this)
    this.transferFile = this.transferFile.bind(this)
  }

  componentDidMount () {
    const { peer } = this.props

    peer.on('close', () => {
      this.setState({ status: constants.CONN_STATUS_CLOSE })
    })
    peer.on('error', () => {
      this.setState({ status: constants.CONN_STATUS_ERROR })
    })
  }

  handleStart () {
    this.setState({ start: true }, this.transferFile)
  }

  transferFile () {
    const { file, peer } = this.props
    const { start, step } = this.state

    if (step !== constants.PROCESS_STEP_CONNECTED || !start) {
      return
    }

    // step 1: send an "init" packet
    this.setState({ step: constants.PROCESS_STEP_INIT }, () => {
      peer.send({ type: constants.PROCESS_STEP_INIT })
    })

    peer.on('data', message => {
      const { step } = this.state

      const sendChunk = () => {
        const { chunkNumber } = this.state
        // step 3: send chunk
        const chunk = file.slice(CHUNK_SIZE * chunkNumber, CHUNK_SIZE * (chunkNumber + 1))
        peer.send({
          type: constants.PROCESS_STEP_CHUNK,
          chunk,
          chunkNumber
        })
      }

      switch (message.type) {
        case `${constants.PROCESS_STEP_INIT}-ack`:
          if (step === constants.PROCESS_STEP_INIT) {
            this.setState({ step: constants.PROCESS_STEP_INFO }, () => {
              // step 2: send file info
              peer.send({
                type: constants.PROCESS_STEP_INFO,
                filesize: file.size,
                filename: file.name,
                filetype: file.type,
                chunks: this.totalChunks
              })
            })
          }
          break

        case `${constants.PROCESS_STEP_INFO}-ack`:
          if (step === constants.PROCESS_STEP_INFO) {
            this.setState({ step: constants.PROCESS_STEP_CHUNK }, () => {
              sendChunk()
            })
          }
          break

        case `${constants.PROCESS_STEP_CHUNK}-ack`:
          if (step === constants.PROCESS_STEP_CHUNK) {
            let { chunkNumber } = this.state
            chunkNumber += 1

            if (chunkNumber >= this.totalChunks) {
              this.setState({ chunkNumber, step: constants.PROCESS_STEP_COMPLETE })
            } else {
              this.setState({ chunkNumber }, () => {
                sendChunk()
              })
            }
          }
          break

        default:
          break
      }
    })
  }

  render () {
    const { start, status, step, chunkNumber } = this.state

    let icon = faUser
    if (step === constants.PROCESS_STEP_COMPLETE) {
      icon = faUserCheck
    } else if (status === constants.CONN_STATUS_CLOSE || status === constants.CONN_STATUS_ERROR) {
      icon = faUserSlash
    }

    let progress = 100 * chunkNumber / this.totalChunks
    if (step !== constants.PROCESS_STEP_COMPLETE) {
      progress = Math.min(progress, 99.99) // dont show 100% because of rounding if not complete
    }

    return (
      <div className='peer'>
        <FontAwesomeIcon className='user-icon' icon={icon} />
        {status === constants.CONN_STATUS_OPEN && !start && (
          <button onClick={this.handleStart}>Start</button>
        )}
        {status === constants.CONN_STATUS_OPEN && start && chunkNumber <= 0 && (
          <div>
            <div>Waiting for peer</div>
            <FontAwesomeIcon className='loading-icon' icon={faSpinnerThird} />
          </div>
        )}
        {start && chunkNumber > 0 && (
          <div className='progress'>
            <div className='progress-inner' style={{ width: `${progress}%` }} />
            <label>{Math.round(progress * 100) / 100}%</label>
          </div>
        )}
        {step === constants.PROCESS_STEP_COMPLETE && <div>Completed</div>}
        {step !== constants.PROCESS_STEP_COMPLETE && status === constants.CONN_STATUS_CLOSE && <div>Disconnected</div>}
        {step !== constants.PROCESS_STEP_COMPLETE && status === constants.CONN_STATUS_ERROR && <div>Error</div>}
      </div>
    )
  }
}

Peer.propTypes = {
  file: PropTypes.object.isRequired,
  password: PropTypes.string,
  peer: PropTypes.object.isRequired
}

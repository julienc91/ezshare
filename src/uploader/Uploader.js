import React from 'react'
import FileUploader from './FileUploader'
import WebrtcClient from './WebrtcClient'
import { formatSize, getFileIcon, splitFileExtension } from '../utils'

class Uploader extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      file: null,
      start: false
    }
    this.handleFileChanged = this.handleFileChanged.bind(this)
    this.handleReset = this.handleReset.bind(this)
    this.handleStartWebrtcClient = this.handleStartWebrtcClient.bind(this)
  }

  handleFileChanged (file) {
    this.setState({ file })
  }

  handleReset () {
    this.setState({ file: null, start: false })
  }

  handleStartWebrtcClient () {
    this.setState({ start: true })
  }

  render () {
    const { file, start } = this.state
    const [filename, extension] = splitFileExtension(file && file.name)
    const fileIcon = getFileIcon(file && file.type)

    return (
      <>
        <section>
          <h1>Share a file</h1>

          {!file && <FileUploader onFileSelected={this.handleFileChanged} />}
          {file && (
            <div>
              <div className='uploaded-file'>
                <i className={fileIcon + ' file-icon'} />
                <span className='file-name'>{filename}</span>
                <span className='file-extension'>{extension}</span>
                <span className='file-size'>{formatSize(file.size)}</span>
                <i className={'fas fa-trash' + (start ? ' hidden' : '')} onClick={this.handleReset} />
              </div>
              <div>
                {!start && <button className='default-button' onClick={this.handleStartWebrtcClient}>Start sharing</button>}
              </div>
            </div>
          )}
          {start && <WebrtcClient file={file} />}
        </section>

        <hr />
        <KeyPoints />
      </>
    )
  }
}

export default Uploader

const KeyPoints = () => (
  <section>
    <h1>Our vision</h1>
    <ul className='steps'>
      <li>
        <i className='fas fa-lock' />
        <h3>Encryption</h3>
        <p>End-to-end encryption between you and your peers</p>
      </li>
      <li>
        <i className='fas fa-mask' />
        <h3>Privacy</h3>
        <p>No tracking, no middle-man. Your data is yours and yours only</p>
      </li>
      <li>
        <i className='fas fa-bolt' />
        <h3>Speed</h3>
        <p>No speed limit other than the one of your own connection</p>
      </li>
      <li>
        <i className='fas fa-globe' />
        <h3>Free</h3>
        <p>No restriction whatsoever, and totally free</p>
      </li>
      <li>
        <i className='fas fa-code-branch' />
        <h3>Open Source</h3>
        <p>Contributions are welcome to help us grow and improve our service</p>
      </li>
    </ul>
  </section>
)

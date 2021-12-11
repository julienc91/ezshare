import React, { useCallback, useState } from 'react'
import {
  faBolt,
  faCodeBranch,
  faGlobe,
  faLock,
  faMask,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import FileUploader from './FileUploader'
import WebrtcClient from './WebrtcClient'
import { formatSize, getFileIcon, splitFileExtension } from '../utils'

const Uploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [start, setStart] = useState(false)

  const handleReset = useCallback(() => {
    setFile(null)
    setStart(false)
  }, [setFile, setStart])

  const handleStartWebrtcClient = useCallback(() => {
    setStart(true)
  }, [setStart])

  const [filename, extension] = splitFileExtension(file?.name || '')
  const fileIcon = getFileIcon(file?.type || '')

  return (
    <>
      <section>
        <h1>Share a file</h1>

        {!file && <FileUploader onFileSelected={setFile} />}
        {file && (
          <div>
            <div className="uploaded-file">
              <FontAwesomeIcon className="file-icon" icon={fileIcon} />
              <span className="file-name">{filename}</span>
              <span className="file-extension">{extension}</span>
              <span className="file-size">{formatSize(file.size)}</span>
              <FontAwesomeIcon
                className={start ? 'hidden' : ''}
                icon={faTrash}
                onClick={handleReset}
              />
            </div>
            <div>
              {!start && (
                <button
                  className="default-button"
                  onClick={handleStartWebrtcClient}
                >
                  Start sharing
                </button>
              )}
            </div>
          </div>
        )}
        {start && file && <WebrtcClient file={file} />}
      </section>

      <hr />
      <KeyPoints />
    </>
  )
}

export default Uploader

const KeyPoints: React.FC = () => (
  <section>
    <h1>Our vision</h1>
    <ul className="steps">
      <li>
        <FontAwesomeIcon icon={faLock} />
        <h3>Encryption</h3>
        <p>End-to-end encryption between you and your peers</p>
      </li>
      <li>
        <FontAwesomeIcon icon={faMask} />
        <h3>Privacy</h3>
        <p>No tracking, no middle-man. Your data is yours and yours only</p>
      </li>
      <li>
        <FontAwesomeIcon icon={faBolt} />
        <h3>Speed</h3>
        <p>No speed limit other than the one of your own connection</p>
      </li>
      <li>
        <FontAwesomeIcon icon={faGlobe} />
        <h3>Free</h3>
        <p>No restriction whatsoever, and totally free</p>
      </li>
      <li>
        <FontAwesomeIcon icon={faCodeBranch} />
        <h3>Open Source</h3>
        <p>Contributions are welcome to help us grow and improve our service</p>
      </li>
    </ul>
  </section>
)

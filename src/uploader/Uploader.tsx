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
import FileCard from '../FileCard'
import FileUploader from './FileUploader'
import WebrtcClient from './WebrtcClient'

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

  if (!file) {
    return (
      <>
        <section>
          <h1 className="title">Share a file</h1>
          <p className="lead">
            Send a file straight from your browser to someone else's. Nothing is
            uploaded to a server.
          </p>
          <FileUploader onFileSelected={setFile} />
          <HowItWorks />
        </section>
        <hr className="separator" />
        <KeyPoints />
      </>
    )
  }

  return (
    <section>
      <h1 className="title">Share a file</h1>
      <FileCard file={file}>
        {start ? (
          <span className="live-pill">Live · keep this tab open</span>
        ) : (
          <button
            className="icon-button"
            title="Remove file"
            aria-label="Remove file"
            onClick={handleReset}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        )}
      </FileCard>
      {start ? (
        <WebrtcClient file={file} />
      ) : (
        <button
          className="button start-sharing"
          onClick={handleStartWebrtcClient}
        >
          Start sharing
        </button>
      )}
    </section>
  )
}

export default Uploader

const HowItWorks: React.FC = () => (
  <ol className="how-it-works">
    <li>
      <span className="step-number">1</span>
      <div>
        <h3>Pick a file</h3>
        <p>
          <span className="pointer-only">
            Drop it above or browse your disk.
          </span>
          <span className="touch-only">From your phone's files or photos.</span>
        </p>
      </div>
    </li>
    <li>
      <span className="step-number">2</span>
      <div>
        <h3>Share the link</h3>
        <p>Send it, or let them scan the QR code.</p>
      </div>
    </li>
    <li>
      <span className="step-number">3</span>
      <div>
        <h3>They download it</h3>
        <p>The file goes directly from your browser to theirs.</p>
      </div>
    </li>
  </ol>
)

const KeyPoints: React.FC = () => (
  <section>
    <h2 className="title small">Our vision</h2>
    <ul className="vision">
      <li>
        <span className="vision-icon">
          <FontAwesomeIcon icon={faLock} />
        </span>
        <div>
          <h3>Encryption</h3>
          <p>End-to-end encryption between you and your peers</p>
        </div>
      </li>
      <li>
        <span className="vision-icon">
          <FontAwesomeIcon icon={faMask} />
        </span>
        <div>
          <h3>Privacy</h3>
          <p>No tracking, no middle-man. Your data is yours and yours only</p>
        </div>
      </li>
      <li>
        <span className="vision-icon">
          <FontAwesomeIcon icon={faBolt} />
        </span>
        <div>
          <h3>Speed</h3>
          <p>No speed limit other than the one of your own connection</p>
        </div>
      </li>
      <li>
        <span className="vision-icon">
          <FontAwesomeIcon icon={faGlobe} />
        </span>
        <div>
          <h3>Free</h3>
          <p>No restriction whatsoever, and totally free</p>
        </div>
      </li>
      <li>
        <span className="vision-icon">
          <FontAwesomeIcon icon={faCodeBranch} />
        </span>
        <div>
          <h3>Open Source</h3>
          <p>Contributions are welcome to help us grow and improve</p>
        </div>
      </li>
    </ul>
  </section>
)

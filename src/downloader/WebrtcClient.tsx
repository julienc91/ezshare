import React, { useCallback, useEffect, useRef, useState } from 'react'
import Peer, { DataConnection } from 'peerjs'
import { faSave, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CONN_STATUSES, STEPS } from '../constants'
import {
  formatSize,
  getFileIcon,
  splitFileExtension,
  syncStateWithRef,
} from '../utils'

type Message = {
  type: string
  filesize: number
  filename: string
  filetype: string
  chunks: number
  chunk: ArrayBuffer
}

type FileInfo = {
  size?: number
  name?: string
  type?: string
  chunks?: number
}

const WebrtcClient: React.FC<{ id: string }> = ({ id }) => {
  const [connStatus, setConnStatus] = useState<CONN_STATUSES>(
    CONN_STATUSES.CONN_STATUS_OPENING
  )
  const [step, _setStep] = useState<STEPS>(STEPS.PROCESS_STEP_CONNECTED)
  const [fileInfo, _setFileInfo] = useState<FileInfo>({})
  const [chunks, _setChunks] = useState<Blob[]>([])
  const [url, setUrl] = useState('')
  const [downloadedSize, _setDownloadedSize] = useState(0)

  const clientRef = useRef<Peer | null>(null)
  const connRef = useRef<DataConnection | null>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)

  const stepRef = useRef<STEPS>(step)
  const fileInfoRef = useRef<FileInfo>(fileInfo)
  const chunksRef = useRef<Blob[]>(chunks)
  const downloadedSizeRef = useRef<number>(downloadedSize)

  const setStep = syncStateWithRef(_setStep, stepRef)
  const setFileInfo = syncStateWithRef(_setFileInfo, fileInfoRef)
  const setChunks = syncStateWithRef(_setChunks, chunksRef)
  const setDownloadedSize = syncStateWithRef(
    _setDownloadedSize,
    downloadedSizeRef
  )

  const handleStart = useCallback(() => {
    if (stepRef.current !== STEPS.PROCESS_STEP_INFO) {
      return
    }
    setStep(STEPS.PROCESS_STEP_CHUNK)
    connRef.current?.send({ type: `${STEPS.PROCESS_STEP_INFO}-ack` })
  }, [setStep])

  const handleReceiveData = (data: unknown) => {
    const message = data as Message
    if (message.type === STEPS.PROCESS_STEP_INIT) {
      setStep(STEPS.PROCESS_STEP_INIT)
      connRef.current?.send({ type: `${STEPS.PROCESS_STEP_INIT}-ack` })
    } else if (message.type === STEPS.PROCESS_STEP_INFO) {
      setStep(STEPS.PROCESS_STEP_INFO)
      setFileInfo({
        size: message.filesize,
        name: message.filename,
        type: message.filetype,
        chunks: message.chunks,
      })
    } else if (message.type === STEPS.PROCESS_STEP_CHUNK) {
      const chunk = message.chunk
      setChunks([...chunksRef.current, new Blob([chunk])])
      setDownloadedSize(downloadedSizeRef.current + chunk.byteLength)
      connRef.current?.send({ type: 'chunk-ack' })

      if (chunksRef.current.length === fileInfoRef.current.chunks) {
        const blob = new Blob(chunksRef.current, {
          type: fileInfoRef.current.type,
        })
        const url = URL.createObjectURL(blob)
        setStep(STEPS.PROCESS_STEP_COMPLETE)
        setUrl(url)
        linkRef.current?.click()
      }
    }
  }

  if (!clientRef.current) {
    const client = new Peer({ host: '/', port: 9000 })
    client.on('open', () => {
      connRef.current = client.connect(id)

      const conn = connRef.current
      conn.on('open', () => {
        setConnStatus(CONN_STATUSES.CONN_STATUS_OPEN)
      })
      conn.on('data', handleReceiveData)
      conn.on('close', () => {
        setConnStatus(CONN_STATUSES.CONN_STATUS_CLOSE)
      })
      conn.on('error', () => {
        setConnStatus(CONN_STATUSES.CONN_STATUS_ERROR)
      })
    })
    clientRef.current = client
  }

  useEffect(() => {
    return () => clientRef.current?.destroy()
  }, [])

  if (step !== STEPS.PROCESS_STEP_COMPLETE) {
    if (connStatus === CONN_STATUSES.CONN_STATUS_OPENING) {
      return <NotConnected />
    } else if (
      connStatus === CONN_STATUSES.CONN_STATUS_ERROR ||
      connStatus === CONN_STATUSES.CONN_STATUS_CLOSE
    ) {
      return <Disconnected />
    }
  }

  if (
    step === STEPS.PROCESS_STEP_CONNECTED ||
    step === STEPS.PROCESS_STEP_INIT
  ) {
    return (
      <section>
        <h1>Connected</h1>
        <div>
          <FontAwesomeIcon className="loading-icon" icon={faSpinner} />
        </div>
        <div>
          <p>The connection was established.</p>
          <p>We're waiting for the uploader to approve your download.</p>
        </div>
      </section>
    )
  }

  const [filename, extension] = splitFileExtension(fileInfo?.name || '')
  const fileIcon = getFileIcon(fileInfo?.type || '')

  let progress = 0
  if (step === STEPS.PROCESS_STEP_COMPLETE) {
    progress = 100
  } else if (fileInfo.size && fileInfo.size > 0) {
    progress = (downloadedSize * 100) / fileInfo.size
  }

  return (
    <section>
      <h1>
        {step === STEPS.PROCESS_STEP_INFO && <>Ready to download</>}
        {step === STEPS.PROCESS_STEP_CHUNK && <>Downloading</>}
        {step === STEPS.PROCESS_STEP_COMPLETE && <>Download complete</>}
      </h1>
      <div>
        <div className="uploaded-file">
          <FontAwesomeIcon className="file-icon" icon={fileIcon} />
          <span className="file-name">{filename}</span>
          <span className="file-extension">{extension}</span>
          <span className="file-size">{formatSize(fileInfo?.size || 0)}</span>
        </div>
        {step === STEPS.PROCESS_STEP_INFO && (
          <div>
            <button className="default-button" onClick={handleStart}>
              Download
            </button>
          </div>
        )}
        {step === STEPS.PROCESS_STEP_CHUNK && (
          <div className="progress">
            <div className="progress-inner" style={{ width: `${progress}%` }} />
            <label>{Math.round(progress * 100) / 100}%</label>
          </div>
        )}
        {step === STEPS.PROCESS_STEP_COMPLETE && (
          <div>
            <p>Click the link below to save the file on your computer.</p>
            <div className="save-link">
              <FontAwesomeIcon icon={faSave} />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                download={fileInfo?.name || ''}
                ref={linkRef}
              >
                {fileInfo?.name || ''}
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

const NotConnected: React.FC = () => {
  return (
    <section>
      <h1>Waiting for connection</h1>
      <div>
        <FontAwesomeIcon className="loading-icon" icon={faSpinner} />
      </div>
      <div>
        <p>We're waiting for the uploader to establish the connection.</p>
        <p>If this is taking too long, make sure your link is still valid.</p>
      </div>
    </section>
  )
}

const Disconnected: React.FC = () => {
  return (
    <section>
      <h1>Disconnected</h1>
      <div>
        <p>The connection was lost.</p>
      </div>
    </section>
  )
}

export default WebrtcClient

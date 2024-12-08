import React, { useContext, useEffect, useRef, useState } from 'react'
import { faSave, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { trysteroConfig } from '../constants'
import { formatSize, getFileIcon, splitFileExtension } from '../utils'
import { joinRoom } from 'trystero/mqtt'
import {
  FileInfo,
  TransferAcceptPayload,
  FileInfoPayload,
  Peer,
} from '../types.ts'
import { DownloaderContext } from './context.ts'

const WebrtcClient: React.FC<{ roomId: string }> = ({ roomId }) => {
  const uploaderId = roomId.replace(/-/g, '')
  const room = joinRoom(trysteroConfig, roomId)

  const [uploader, setUploader] = useState<Peer | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)

  const [sendSetupMessage, getSetupMessage] = room.makeAction<
    FileInfoPayload | TransferAcceptPayload
  >('setup')
  const [_sendFile, getFile, onFileProgress] =
    room.makeAction<ArrayBuffer>('file')

  room.onPeerLeave((peerId) => {
    if (peerId === uploaderId) {
      setUploader({
        peerId: uploaderId,
        connectionStatus: 'disconnected',
        transferStatus: uploader?.transferStatus ?? null,
        progress: uploader?.progress ?? 0,
      })
    }
  })

  getSetupMessage((data, peerId) => {
    if (peerId === uploaderId && data.type === 'metadata') {
      setFileInfo(data)
      setUploader({
        peerId: uploaderId,
        connectionStatus: 'connected',
        transferStatus: 'not_started',
        progress: 0,
      })
    }
  })

  getFile((payload, peerId) => {
    if (
      peerId === uploaderId &&
      fileInfo &&
      payload &&
      uploader?.transferStatus === 'in_progress'
    ) {
      setBlob(new Blob([payload], { type: fileInfo.filetype }))
      setUploader({ ...uploader, transferStatus: 'completed', progress: 100 })
    }
  })

  onFileProgress((percent, peerId) => {
    if (peerId === uploader?.peerId) {
      setUploader({ ...uploader, progress: percent * 100 })
    }
  })

  if (!uploader) {
    return <NotConnected />
  }

  if (
    uploader.connectionStatus === 'disconnected' &&
    uploader.transferStatus !== 'completed'
  ) {
    return <Disconnected />
  }

  const handleAcceptTransfer = async () => {
    setUploader({ ...uploader, transferStatus: 'in_progress' })
    await sendSetupMessage({ type: 'accept' }, uploader.peerId)
  }

  return (
    <DownloaderContext.Provider
      value={{ room, uploader, fileInfo, handleAcceptTransfer, blob }}
    >
      <DownloadInfo />
    </DownloaderContext.Provider>
  )
}

const DownloadInfo: React.FC = () => {
  const { uploader, fileInfo, handleAcceptTransfer } =
    useContext(DownloaderContext)
  if (!fileInfo) {
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

  const [filename, extension] = splitFileExtension(fileInfo.filename || '')
  const fileIcon = getFileIcon(fileInfo.filetype || '')
  const progress = uploader.progress

  return (
    <section>
      <h1>
        {uploader.transferStatus === 'not_started' && 'Ready to download'}
        {uploader.transferStatus === 'in_progress' && 'Downloading'}
        {uploader.transferStatus === 'completed' && 'Download complete'}
      </h1>
      <div>
        <div className="uploaded-file">
          <FontAwesomeIcon className="file-icon" icon={fileIcon} />
          <span className="file-name">{filename}</span>
          <span className="file-extension">{extension}</span>
          <span className="file-size">{formatSize(fileInfo.filesize)}</span>
        </div>
        {uploader.transferStatus === 'not_started' && (
          <div>
            <button className="default-button" onClick={handleAcceptTransfer}>
              Download
            </button>
          </div>
        )}
        {uploader.transferStatus === 'in_progress' && (
          <div className="progress">
            <div className="progress-inner" style={{ width: `${progress}%` }} />
            <label>{Math.round(progress * 100) / 100}%</label>
          </div>
        )}
        {uploader.transferStatus === 'completed' && <TransferComplete />}
      </div>
    </section>
  )
}

const TransferComplete: React.FC = () => {
  const { fileInfo, blob } = useContext(DownloaderContext)
  const linkRef = useRef<HTMLAnchorElement>(null)
  const [blobUrl, setBlobUrl] = useState<string>('')

  useEffect(() => {
    if (blob && fileInfo && blobUrl === '') {
      const url = URL.createObjectURL(blob)
      setBlobUrl(url)
    }
  }, [blobUrl, blob])

  useEffect(() => {
    if (blobUrl !== '') {
      linkRef.current?.click()
    }
  }, [blobUrl])

  if (!fileInfo) {
    return null
  }

  return (
    <div>
      <p>Click the link below to save the file on your computer.</p>
      <div className="save-link">
        <FontAwesomeIcon icon={faSave} />
        <a
          href={blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={fileInfo.filename}
          ref={linkRef}
        >
          {fileInfo.filename}
        </a>
      </div>
    </div>
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
        <p>The uploader aborted the transfer.</p>
      </div>
    </section>
  )
}

export default WebrtcClient

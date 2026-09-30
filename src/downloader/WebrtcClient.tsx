import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { faSave, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  FILE_SLICE_SIZE,
  PROGRESS_UPDATE_INTERVAL_MS,
  trysteroConfig,
} from '../constants'
import {
  formatSize,
  getFileIcon,
  normalizeShareCode,
  splitFileExtension,
  throttle,
} from '../utils'
import { joinRoom } from '@trystero-p2p/mqtt'
import {
  FileInfo,
  TransferAcceptPayload,
  FileInfoPayload,
  Peer,
} from '../types.ts'
import { DownloaderContext } from './context.ts'

const WebrtcClient: React.FC<{ roomId: string }> = ({ roomId }) => {
  const room = useMemo(
    () => joinRoom(trysteroConfig, normalizeShareCode(roomId)),
    [roomId],
  )

  const [uploader, setUploader] = useState<Peer | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const receivedSlices = useRef<ArrayBuffer[]>([])
  const receivedBytes = useRef(0)

  const setupAction = room.makeAction<FileInfoPayload | TransferAcceptPayload>(
    'setup',
  )
  const fileAction = room.makeAction<ArrayBuffer>('file')
  const reportProgress = useMemo(
    () =>
      throttle((progress: number) => {
        setUploader((uploader) => uploader && { ...uploader, progress })
      }, PROGRESS_UPDATE_INTERVAL_MS),
    [],
  )

  room.onPeerLeave = (peerId) => {
    setUploader((uploader) =>
      uploader?.peerId === peerId
        ? { ...uploader, connectionStatus: 'disconnected' }
        : uploader,
    )
  }

  // The share code doesn't identify the uploader: it is the first peer
  // to send the file metadata, which it only does once it approved us.
  // Anyone else who knows the code could do the same, so if a second
  // peer sends metadata we can't tell which one is genuine and give up.
  // Kept in a ref so that messages handled before the next render see it.
  const uploaderPeerId = useRef<string | null>(null)
  const [conflict, setConflict] = useState(false)

  setupAction.onMessage = (data, { peerId }) => {
    if (data.type !== 'metadata') {
      return
    }
    uploaderPeerId.current ??= peerId
    if (peerId !== uploaderPeerId.current) {
      setConflict(true)
      room.leave().catch(() => {})
    } else {
      setFileInfo(data)
      setUploader({
        peerId,
        connectionStatus: 'connected',
        transferStatus: 'not_started',
        progress: 0,
      })
    }
  }

  fileAction.onMessage = (payload, { peerId }) => {
    if (
      peerId === uploader?.peerId &&
      fileInfo &&
      payload &&
      uploader?.transferStatus === 'in_progress'
    ) {
      receivedSlices.current.push(payload)
      receivedBytes.current += payload.byteLength
      if (receivedBytes.current >= fileInfo.filesize) {
        setBlob(new Blob(receivedSlices.current, { type: fileInfo.filetype }))
        receivedSlices.current = []
        setUploader({ ...uploader, transferStatus: 'completed', progress: 100 })
      }
    }
  }

  fileAction.onReceiveProgress = (percent, { peerId }) => {
    if (peerId === uploader?.peerId && fileInfo?.filesize) {
      const sliceSize = Math.min(
        FILE_SLICE_SIZE,
        fileInfo.filesize - receivedBytes.current,
      )
      reportProgress(
        ((receivedBytes.current + percent * sliceSize) / fileInfo.filesize) *
          100,
      )
    }
  }

  if (conflict) {
    return <Conflict />
  }

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
    await setupAction.send({ type: 'accept' }, { target: uploader.peerId })
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

const Conflict: React.FC = () => {
  return (
    <section>
      <h1>Transfer aborted</h1>
      <div>
        <p>Several peers claimed to be sharing a file with this code.</p>
        <p>
          To be safe, ask the uploader to share the file again with a new link.
        </p>
      </div>
    </section>
  )
}

export default WebrtcClient

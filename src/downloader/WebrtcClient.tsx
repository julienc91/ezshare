import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  faDownload,
  faFloppyDisk,
  faLock,
  faPlugCircleXmark,
  faShareNodes,
  faSpinner,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  FILE_SLICE_SIZE,
  JOIN_TIMEOUT_MS,
  PROGRESS_UPDATE_INTERVAL_MS,
  trysteroConfig,
} from '../constants'
import { formatSize, getFileIcon, normalizeShareCode, throttle } from '../utils'
import Progress from '../Progress.tsx'
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

  // Until the uploader approves us, we can't tell it apart from other
  // downloaders: we only give up on the code while nobody else is in the room
  const [isAlone, setIsAlone] = useState(true)
  const [timedOut, setTimedOut] = useState(false)

  // The onPeerJoin setter synchronously replays already connected peers,
  // so it must not be (re)assigned during render
  useEffect(() => {
    room.onPeerJoin = () => setIsAlone(false)
    return () => {
      room.onPeerJoin = null
    }
  }, [room])

  useEffect(() => {
    if (!isAlone) {
      setTimedOut(false)
      return
    }
    const timeout = setTimeout(() => setTimedOut(true), JOIN_TIMEOUT_MS)
    return () => clearTimeout(timeout)
  }, [isAlone])

  room.onPeerLeave = (peerId) => {
    setIsAlone(Object.keys(room.getPeers()).length === 0)
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
    return timedOut ? <NoUploader /> : <NotConnected />
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

const DownloadPage: React.FC<{
  title: string
  children: React.ReactNode
}> = ({ title, children }) => (
  <section>
    <h1 className="title">{title}</h1>
    <div className="card download-card">{children}</div>
    <ul className="reassurance">
      <li>
        <FontAwesomeIcon icon={faLock} />
        End-to-end encrypted
      </li>
      <li>
        <FontAwesomeIcon icon={faShareNodes} />
        Peer-to-peer, no server storage
      </li>
    </ul>
  </section>
)

const DownloadInfo: React.FC = () => {
  const { uploader, fileInfo, handleAcceptTransfer } =
    useContext(DownloaderContext)
  if (!fileInfo) {
    return (
      <DownloadPage title="Connected">
        <FontAwesomeIcon className="loading-icon" icon={faSpinner} />
        <div className="message">
          <p>The connection was established.</p>
          <p className="muted">
            We're waiting for the uploader to approve your download.
          </p>
        </div>
      </DownloadPage>
    )
  }

  const titles = {
    not_started: 'Ready to download',
    in_progress: 'Downloading',
    completed: 'Download complete',
  }

  return (
    <DownloadPage title={titles[uploader.transferStatus ?? 'not_started']}>
      <div className="downloaded-file">
        <span className="file-badge">
          <FontAwesomeIcon icon={getFileIcon(fileInfo.filetype)} />
        </span>
        <div className="file-name" title={fileInfo.filename}>
          {fileInfo.filename}
        </div>
        <div className="file-size">{formatSize(fileInfo.filesize)}</div>
      </div>
      {uploader.transferStatus === 'not_started' && (
        <button className="button" onClick={handleAcceptTransfer}>
          <FontAwesomeIcon icon={faDownload} />
          Download
        </button>
      )}
      {uploader.transferStatus === 'in_progress' && (
        <Progress progress={uploader.progress} size={fileInfo.filesize} />
      )}
      {uploader.transferStatus === 'completed' && <TransferComplete />}
    </DownloadPage>
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
    <div className="save-link">
      <p>Your download should start automatically. If it doesn't:</p>
      <a
        className="button"
        href={blobUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={fileInfo.filename}
        ref={linkRef}
      >
        <FontAwesomeIcon icon={faFloppyDisk} />
        <span>Save {fileInfo.filename}</span>
      </a>
    </div>
  )
}

const NotConnected: React.FC = () => {
  return (
    <DownloadPage title="Waiting for connection">
      <FontAwesomeIcon className="loading-icon" icon={faSpinner} />
      <div className="message">
        <p>We're waiting for the uploader to establish the connection.</p>
        <p className="muted">
          If this is taking too long, make sure your link is still valid.
        </p>
      </div>
    </DownloadPage>
  )
}

const NoUploader: React.FC = () => {
  return (
    <DownloadPage title="No file shared">
      <FontAwesomeIcon className="loading-icon" icon={faSpinner} />
      <div className="message">
        <p>Nobody is sharing a file with this code at the moment.</p>
        <p className="muted">
          Check that the code is correct, and that the uploader's page is still
          open. We're still listening, in case they join.
        </p>
      </div>
    </DownloadPage>
  )
}

const Disconnected: React.FC = () => {
  return (
    <DownloadPage title="Disconnected">
      <FontAwesomeIcon className="status-icon" icon={faPlugCircleXmark} />
      <div className="message">
        <p>The uploader aborted the transfer.</p>
      </div>
    </DownloadPage>
  )
}

const Conflict: React.FC = () => {
  return (
    <DownloadPage title="Transfer aborted">
      <FontAwesomeIcon className="status-icon" icon={faTriangleExclamation} />
      <div className="message">
        <p>Several peers claimed to be sharing a file with this code.</p>
        <p className="muted">
          To be safe, ask the uploader to share the file again with a new link.
        </p>
      </div>
    </DownloadPage>
  )
}

export default WebrtcClient

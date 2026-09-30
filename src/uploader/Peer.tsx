import React, { useContext, useMemo } from 'react'
import {
  faCheck,
  faSpinner,
  faUser,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { TransferAcceptPayload, FileInfoPayload, Peer } from '../types'
import { UploaderContext } from './context.ts'
import { FILE_SLICE_SIZE, PROGRESS_UPDATE_INTERVAL_MS } from '../constants.ts'
import { throttle } from '../utils.ts'
import Progress from '../Progress.tsx'

const PeerItem: React.FC<{
  peer: Peer
}> = ({ peer }) => {
  const { room, file, setTransferStatus, setProgress } =
    useContext(UploaderContext)
  const setupAction = room.makeAction<FileInfoPayload | TransferAcceptPayload>(
    'setup',
  )
  const fileAction = room.makeAction<ArrayBuffer>('file')

  const fileMetadata = useMemo(() => {
    return {
      filesize: file.size,
      filename: file.name,
      filetype: file.type,
    }
  }, [file])

  const handleStartTransfer = async () => {
    await setupAction.send(
      {
        type: 'metadata',
        ...fileMetadata,
      },
      { target: peer.peerId },
    )
    setTransferStatus(peer.peerId, 'not_started')
  }

  setupAction.onMessage = async (payload, { peerId }) => {
    if (
      payload.type === 'accept' &&
      peerId === peer.peerId &&
      peer.transferStatus === 'not_started'
    ) {
      setTransferStatus(peer.peerId, 'in_progress')
      const reportProgress = throttle((sentBytes: number) => {
        setProgress(peer.peerId, (sentBytes / (file.size || 1)) * 100)
      }, PROGRESS_UPDATE_INTERVAL_MS)
      // The next slice is read from disk while the current one is being sent
      const sliceCount = Math.max(1, Math.ceil(file.size / FILE_SLICE_SIZE))
      const readSlice = (i: number) =>
        file.slice(i * FILE_SLICE_SIZE, (i + 1) * FILE_SLICE_SIZE).arrayBuffer()
      let nextSlice = readSlice(0)
      for (let i = 0; i < sliceCount; i++) {
        const slice = await nextSlice
        if (!room.getPeers()[peer.peerId]) {
          return
        }
        if (i + 1 < sliceCount) {
          nextSlice = readSlice(i + 1)
        }
        await fileAction.send(slice, {
          target: peer.peerId,
          onProgress: (progress) => {
            reportProgress(i * FILE_SLICE_SIZE + progress * slice.byteLength)
          },
        })
      }
      setProgress(peer.peerId, 100)
    }
  }

  let label, status
  if (peer.transferStatus === 'completed') {
    label = 'Transfer finished'
    status = (
      <div className="peer-status done">
        <span className="status-badge">
          <FontAwesomeIcon icon={faCheck} />
        </span>
        Completed
      </div>
    )
  } else if (peer.connectionStatus === 'disconnected') {
    label = 'Left the page'
    status = (
      <div className="peer-status gone">
        <FontAwesomeIcon icon={faXmark} />
        Disconnected
      </div>
    )
  } else if (peer.transferStatus === null) {
    label = 'Connected'
    status = (
      <button className="button" onClick={handleStartTransfer}>
        Start
      </button>
    )
  } else if (peer.transferStatus === 'not_started') {
    label = 'Download requested'
    status = (
      <div className="peer-status">
        <FontAwesomeIcon className="loading-icon" icon={faSpinner} />
        Waiting for peer
      </div>
    )
  } else {
    label = 'Receiving the file'
    status = <Progress progress={peer.progress} size={file.size} />
  }

  return (
    <div
      className={
        'card raised peer' +
        (peer.connectionStatus === 'disconnected' &&
        peer.transferStatus !== 'completed'
          ? ' disconnected'
          : '')
      }
    >
      <div className="peer-identity">
        <span className="peer-avatar">
          <FontAwesomeIcon icon={faUser} />
        </span>
        <div className="peer-label">{label}</div>
      </div>
      {status}
    </div>
  )
}

export default PeerItem

import React, { useContext, useMemo } from 'react'
import {
  faSpinner,
  faUser,
  faUserCheck,
  faUserSlash,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { TransferAcceptPayload, FileInfoPayload, Peer } from '../types'
import { UploaderContext } from './context.ts'
import { FILE_SLICE_SIZE, PROGRESS_UPDATE_INTERVAL_MS } from '../constants.ts'
import { throttle } from '../utils.ts'

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

  let inner
  if (peer.transferStatus === 'completed') {
    inner = (
      <>
        <FontAwesomeIcon className="user-icon" icon={faUserCheck} />
        <div>Completed</div>
      </>
    )
  } else if (peer.connectionStatus === 'disconnected') {
    inner = (
      <>
        <FontAwesomeIcon className="user-icon" icon={faUserSlash} />
        <div>Disconnected</div>
      </>
    )
  } else if (peer.transferStatus === null) {
    inner = (
      <>
        <FontAwesomeIcon className="user-icon" icon={faUser} />
        <button onClick={handleStartTransfer}>Start</button>
      </>
    )
  } else if (peer.transferStatus === 'not_started') {
    inner = (
      <>
        <FontAwesomeIcon className="user-icon" icon={faUser} />
        <div>
          <div>Waiting for peer</div>
          <FontAwesomeIcon className="loading-icon" icon={faSpinner} />
        </div>
      </>
    )
  } else if (peer.transferStatus === 'in_progress') {
    inner = (
      <>
        <FontAwesomeIcon className="user-icon" icon={faUser} />
        <div className="progress">
          <div
            className="progress-inner"
            style={{ width: `${peer.progress}%` }}
          />
          <label>{Math.round(peer.progress * 100) / 100}%</label>
        </div>
      </>
    )
  }

  return <div className="peer">{inner}</div>
}

export default PeerItem

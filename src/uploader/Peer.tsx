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

const PeerItem: React.FC<{
  peer: Peer
}> = ({ peer }) => {
  const { room, file, setTransferStatus, setProgress } =
    useContext(UploaderContext)
  const [sendSetupMessage, getSetupMessage] = room.makeAction<
    FileInfoPayload | TransferAcceptPayload
  >('setup')
  const [sendFile] = room.makeAction('file')

  const fileMetadata = useMemo(() => {
    return {
      filesize: file.size,
      filename: file.name,
      filetype: file.type,
    }
  }, [file])

  const handleStartTransfer = async () => {
    await sendSetupMessage(
      {
        type: 'metadata',
        ...fileMetadata,
      },
      peer.peerId,
    )
    setTransferStatus(peer.peerId, 'not_started')
  }

  getSetupMessage(async (payload, peerId) => {
    if (
      payload.type === 'accept' &&
      peerId === peer.peerId &&
      peer.transferStatus === 'not_started'
    ) {
      setTransferStatus(peer.peerId, 'in_progress')
      const buffer = await file.arrayBuffer()
      await sendFile(buffer, peer.peerId, fileMetadata, (progress) => {
        setProgress(peer.peerId, progress * 100)
      })
    }
  })

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

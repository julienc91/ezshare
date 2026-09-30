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
import Progress from '../Progress.tsx'

const PeerItem: React.FC<{
  peer: Peer
}> = ({ peer }) => {
  const { room, file, setTransferStatus } = useContext(UploaderContext)
  const setupAction = room.makeAction<FileInfoPayload | TransferAcceptPayload>(
    'setup',
  )

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

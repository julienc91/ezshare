import React, { useEffect, useRef, useState } from 'react'
import Peer, { DataConnection } from 'peerjs'
import {
  faExclamationCircle,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DownloadLink from './DownloadLink'
import PeerList from './PeerList'
import { CLIENT_STATUSES } from '../constants'
import { syncStateWithRef } from '../utils'

const WebrtcClient: React.FC<{ file: File; password?: string }> = ({
  file,
  password,
}) => {
  const [clientStatus, setClientStatus] = useState<CLIENT_STATUSES>(
    CLIENT_STATUSES.CLIENT_STATUS_OPENING
  )
  const [peers, _setPeers] = useState<DataConnection[]>([])
  const [id, setId] = useState<string>('')

  const clientRef = useRef<Peer | null>()
  const peersRef = useRef<DataConnection[]>(peers)

  const setPeers = syncStateWithRef(_setPeers, peersRef)

  const handleRefresh = () => document.location.reload()

  const handleBeforeUnload = (e: Event) => {
    if (peersRef.current.length > 0) {
      e.preventDefault()
      return 'Are you sure? Your link will be lost'
    }
  }

  const handleNewPeer = (peer: DataConnection) => {
    setPeers([...peersRef.current, peer])
  }

  if (!clientRef.current) {
    const client = new Peer({ host: '/', port: 9000 })
    client.on('open', (id) => {
      setId(id)
      setClientStatus(CLIENT_STATUSES.CLIENT_STATUS_OPEN)
    })
    client.on('close', () => {
      setClientStatus(CLIENT_STATUSES.CLIENT_STATUS_CLOSE)
    })
    client.on('error', () => {
      setClientStatus(CLIENT_STATUSES.CLIENT_STATUS_ERROR)
    })
    client.on('connection', (peer: DataConnection) => {
      peer.on('open', () => {
        handleNewPeer(peer)
      })
    })
    clientRef.current = client
  }

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clientRef.current?.destroy()
    }
  }, [])

  const url = new URL(`/download/${id}/`, document.baseURI).href
  return (
    <>
      {id && (
        <>
          <DownloadLink id={id} url={url} />
          <PeerList file={file} password={password} peers={peers} />
        </>
      )}
      {!id && clientStatus === CLIENT_STATUSES.CLIENT_STATUS_OPENING && (
        <>
          <div>
            <FontAwesomeIcon icon={faSpinner} />
          </div>
          <div>Waiting to establish a connection with the server</div>
        </>
      )}
      {!id && clientStatus !== CLIENT_STATUSES.CLIENT_STATUS_OPENING && (
        <>
          <div>
            <FontAwesomeIcon icon={faExclamationCircle} />
          </div>
          <div>Could not establish a connection to the server.</div>
          <div>
            <button className="default-button" onClick={handleRefresh}>
              Try again
            </button>
          </div>
        </>
      )}
    </>
  )
}

export default WebrtcClient

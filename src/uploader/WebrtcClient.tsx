import React, { useCallback, useEffect, useMemo, useState } from 'react'
import DownloadLink from './DownloadLink'
import PeerList from './PeerList'
import { trysteroConfig } from '../constants'
import { joinRoom } from 'trystero/mqtt'
import { selfId } from 'trystero'
import { Peer } from '../types.ts'
import { UploaderContext } from './context.ts'

const getRoomId = () => {
  if (import.meta.env.VITE_TESTING_E2E) {
    const params = new URLSearchParams(document.location.search)
    const forcedRoomId = params.get('__playwright_room_id')
    if (forcedRoomId?.length) {
      return forcedRoomId
    }
  }
  return `${selfId.slice(0, 4)}-${selfId.slice(4, 8)}-${selfId.slice(8, 16)}-${selfId.slice(16)}`
}

const WebrtcClient: React.FC<{ file: File }> = ({ file }) => {
  const roomId = useMemo(() => getRoomId(), [])
  const room = joinRoom(trysteroConfig, roomId)
  const [peers, setPeers] = useState<Peer[]>([])

  const getPeerFromId = (peerId: string): Peer | undefined => {
    return peers.find((peer) => peer.peerId === peerId)
  }

  const createPeer = (peerId: string) => {
    setPeers([
      ...peers,
      {
        peerId,
        connectionStatus: 'connected',
        transferStatus: null,
        progress: 0,
      },
    ])
  }

  const updatePeer = (peerId: string, updatedData: Partial<Peer>) => {
    setPeers(
      peers.map((peer) =>
        peer.peerId === peerId ? { ...peer, ...updatedData } : peer,
      ),
    )
  }

  room.onPeerJoin(createPeer)
  room.onPeerLeave((peerId) => {
    updatePeer(peerId, { connectionStatus: 'disconnected' })
  })

  const setTransferStatus = (
    peerId: string,
    transferStatus: 'not_started' | 'in_progress',
  ) => {
    const peer = getPeerFromId(peerId)
    if (
      (peer?.transferStatus === null && transferStatus === 'not_started') ||
      (peer?.transferStatus === 'not_started' &&
        transferStatus === 'in_progress')
    ) {
      updatePeer(peerId, { transferStatus })
    }
  }

  const setProgress = (peerId: string, progress: number) => {
    const peer = getPeerFromId(peerId)
    if (peer) {
      if (progress >= 100) {
        updatePeer(peerId, { progress, transferStatus: 'completed' })
      } else {
        updatePeer(peerId, { progress, transferStatus: 'in_progress' })
      }
    }
  }

  const handleBeforeUnload = useCallback(
    (e: Event) => {
      if (
        peers.some(
          (peer) =>
            peer.connectionStatus === 'connected' &&
            peer.transferStatus !== 'completed',
        )
      ) {
        e.preventDefault()
        return 'Are you sure? Your link will be lost'
      }
    },
    [peers],
  )

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [handleBeforeUnload])

  const url = new URL(`/download/${roomId}/`, document.baseURI).href
  return (
    <UploaderContext.Provider
      value={{ file, room, peers, setTransferStatus, setProgress }}
    >
      <DownloadLink id={roomId} url={url} />
      <PeerList />
    </UploaderContext.Provider>
  )
}

export default WebrtcClient

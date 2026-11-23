import React, {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
import DownloadLink from './DownloadLink'
import PeerList from './PeerList'
import { FILE_SLICE_SIZE, PROGRESS_UPDATE_INTERVAL_MS } from '../constants'
import type { MessageContext, Room } from '@trystero-p2p/mqtt'
import { FileInfoPayload, Peer, TransferAcceptPayload } from '../types.ts'
import { generateShareCode, normalizeShareCode, throttle } from '../utils.ts'
import { UploaderContext } from './context.ts'
import { useRoom } from '../hooks.ts'

const getRoomId = () => {
  if (import.meta.env.VITE_TESTING_E2E) {
    const params = new URLSearchParams(document.location.search)
    const forcedRoomId = params.get('__playwright_room_id')
    if (forcedRoomId?.length) {
      return forcedRoomId
    }
  }
  return generateShareCode()
}

const WebrtcClient: React.FC<{ file: File }> = ({ file }) => {
  const roomId = useMemo(() => getRoomId(), [])
  const room = useRoom(normalizeShareCode(roomId))
  return room && <RoomClient file={file} roomId={roomId} room={room} />
}

const RoomClient: React.FC<{ file: File; roomId: string; room: Room }> = ({
  file,
  roomId,
  room,
}) => {
  const [peers, setPeers] = useState<Peer[]>([])

  const getPeerFromId = (peerId: string): Peer | undefined => {
    return peers.find((peer) => peer.peerId === peerId)
  }

  const createPeer = (peerId: string) => {
    setPeers((peers) =>
      peers.some((peer) => peer.peerId === peerId)
        ? peers
        : [
            ...peers,
            {
              peerId,
              connectionStatus: 'connected',
              transferStatus: null,
              progress: 0,
            },
          ],
    )
  }

  const updatePeer = (peerId: string, updatedData: Partial<Peer>) => {
    setPeers((peers) =>
      peers.map((peer) =>
        peer.peerId === peerId ? { ...peer, ...updatedData } : peer,
      ),
    )
  }

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

  // Actions are shared by the whole room, so a single listener serves every peer
  const setupAction = useMemo(
    () => room.makeAction<FileInfoPayload | TransferAcceptPayload>('setup'),
    [room],
  )
  const fileAction = useMemo(() => room.makeAction<ArrayBuffer>('file'), [room])

  const onSetupMessage = useEffectEvent(
    async (
      payload: FileInfoPayload | TransferAcceptPayload,
      { peerId }: MessageContext,
    ) => {
      if (
        payload.type !== 'accept' ||
        getPeerFromId(peerId)?.transferStatus !== 'not_started'
      ) {
        return
      }
      setTransferStatus(peerId, 'in_progress')
      const reportProgress = throttle((sentBytes: number) => {
        setProgress(peerId, (sentBytes / (file.size || 1)) * 100)
      }, PROGRESS_UPDATE_INTERVAL_MS)
      // The next slice is read from disk while the current one is being sent
      const sliceCount = Math.max(1, Math.ceil(file.size / FILE_SLICE_SIZE))
      const readSlice = (i: number) =>
        file.slice(i * FILE_SLICE_SIZE, (i + 1) * FILE_SLICE_SIZE).arrayBuffer()
      let nextSlice = readSlice(0)
      for (let i = 0; i < sliceCount; i++) {
        const slice = await nextSlice
        if (!room.getPeers()[peerId]) {
          return
        }
        if (i + 1 < sliceCount) {
          nextSlice = readSlice(i + 1)
        }
        try {
          await fileAction.send(slice, {
            target: peerId,
            onProgress: (progress) => {
              reportProgress(i * FILE_SLICE_SIZE + progress * slice.byteLength)
            },
          })
        } catch (error) {
          // Sending to a peer that left during the transfer rejects
          if (room.getPeers()[peerId]) {
            throw error
          }
          return
        }
      }
      setProgress(peerId, 100)
    },
  )

  // Listeners are registered once per room, the effect events giving them
  // access to the latest state
  useEffect(() => {
    const unsubscribes = [
      room.onPeerJoin(({ peerId }) => createPeer(peerId), { replay: true }),
      room.onPeerLeave(({ peerId }) =>
        updatePeer(peerId, { connectionStatus: 'disconnected' }),
      ),
      setupAction.onMessage((data, context) => onSetupMessage(data, context)),
    ]
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [room, setupAction])

  // Read through a ref so the listener isn't re-registered on every progress update
  const peersRef = useRef(peers)
  peersRef.current = peers

  useEffect(() => {
    const handleBeforeUnload = (e: Event) => {
      if (
        peersRef.current.some(
          (peer) =>
            peer.connectionStatus === 'connected' &&
            peer.transferStatus !== 'completed',
        )
      ) {
        e.preventDefault()
        return 'Are you sure? Your link will be lost'
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const url = new URL(`/d/${roomId}/`, document.baseURI).href
  return (
    <UploaderContext.Provider value={{ file, room, peers, setTransferStatus }}>
      <DownloadLink url={url} />
      <PeerList />
    </UploaderContext.Provider>
  )
}

export default WebrtcClient

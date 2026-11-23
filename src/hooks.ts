import { useEffect, useState } from 'react'
import { joinRoom, type Room } from '@trystero-p2p/mqtt'
import { trysteroConfig } from './constants'

// Joining a room that is already joined throws, so it can't be done during
// render (which StrictMode replays): it is joined in an effect instead, and
// left on cleanup so that it can be joined again
export const useRoom = (roomId: string): Room | null => {
  const [room, setRoom] = useState<Room | null>(null)
  useEffect(() => {
    const room = joinRoom(trysteroConfig, roomId)
    setRoom(room)
    return () => {
      setRoom(null)
      room.leave().catch(() => {})
    }
  }, [roomId])
  return room
}

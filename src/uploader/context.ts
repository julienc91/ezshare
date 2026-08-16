import { createContext } from 'react'
import { Peer } from '../types.ts'
import { Room } from '@trystero-p2p/mqtt'

export const UploaderContext = createContext<{
  file: File
  room: Room
  peers: Peer[]
  setTransferStatus: (
    peerId: string,
    transferStatus: 'not_started' | 'in_progress',
  ) => void
  setProgress: (peerId: string, progress: number) => void
}>(null!)

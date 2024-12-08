import { createContext } from 'react'
import { Room } from 'trystero'
import { FileInfo, Peer } from '../types.ts'

export const DownloaderContext = createContext<{
  room: Room
  uploader: Peer
  fileInfo: FileInfo | null
  handleAcceptTransfer: () => void
  blob: Blob | null
}>(null!)

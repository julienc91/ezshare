export type Peer = {
  peerId: string
  connectionStatus: 'connected' | 'disconnected'
  transferStatus: null | 'not_started' | 'in_progress' | 'completed'
  progress: number
}

export type FileInfo = {
  filesize: number
  filename: string
  filetype: string
}

export type FileInfoPayload = FileInfo & {
  type: 'metadata'
}

export type TransferAcceptPayload = {
  type: 'accept'
}

import React from 'react'
import { useParams } from 'react-router-dom'
import WebrtcClient from './WebrtcClient'

const Downloader: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  if (!roomId) {
    return null
  }
  return <WebrtcClient roomId={roomId} />
}

export default Downloader

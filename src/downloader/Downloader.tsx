import React from 'react'
import { useParams } from 'react-router-dom'
import WebrtcClient from './WebrtcClient'

const Downloader: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  if (!id) {
    return null
  }
  return <WebrtcClient id={id} />
}

export default Downloader

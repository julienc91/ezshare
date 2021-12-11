import React from 'react'
import { useParams } from 'react-router-dom'
import WebrtcClient from './WebrtcClient'

const Downloader = () => {
  const { id } = useParams()
  return (
    <WebrtcClient id={id} />
  )
}

export default Downloader

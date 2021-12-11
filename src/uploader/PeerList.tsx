import React from 'react'
import Peer from './Peer'
import { DataConnection } from 'peerjs'

const PeerList: React.FC<{
  file: File
  password?: string
  peers: DataConnection[]
}> = ({ file, password, peers }) => {
  if (!peers.length) {
    return (
      <section className="peer-list">
        <h2>No peers connected</h2>
        <p>Share your link!</p>
      </section>
    )
  }
  return (
    <section className="peer-list">
      <h2>Peers</h2>
      <ul>
        {peers.map((peer) => {
          return (
            <li key={peer.peer}>
              <Peer file={file} password={password} peer={peer} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default PeerList

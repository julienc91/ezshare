import React, { useContext } from 'react'
import PeerItem from './Peer'
import { UploaderContext } from './context.ts'

const PeerList: React.FC = () => {
  const { peers } = useContext(UploaderContext)
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
            <li key={peer.peerId}>
              <PeerItem peer={peer} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default PeerList

import React, { useContext } from 'react'
import PeerItem from './Peer'
import { UploaderContext } from './context.ts'

const PeerList: React.FC = () => {
  const { peers } = useContext(UploaderContext)
  if (!peers.length) {
    return (
      <section className="peers-header">
        <h2 className="title small">No peers connected</h2>
        <p>Share your link!</p>
      </section>
    )
  }
  return (
    <section>
      <div className="peers-header">
        <h2 className="title small">Peers · {peers.length}</h2>
        <p>Each peer gets the file when you press Start.</p>
      </div>
      <ul className="peer-list">
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

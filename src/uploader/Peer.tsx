import React, { useCallback, useRef, useState } from 'react'
import {
  faSpinner,
  faUser,
  faUserCheck,
  faUserSlash,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CONN_STATUSES, STEPS } from '../constants'
import { DataConnection } from 'peerjs'
import { syncStateWithRef } from '../utils'

const CHUNK_SIZE = 1024 * 1024

const Peer: React.FC<{
  file: File
  password?: string
  peer: DataConnection
}> = ({ file, peer }) => {
  const [status, setStatus] = useState<CONN_STATUSES>(
    CONN_STATUSES.CONN_STATUS_OPEN
  )
  const [start, setStart] = useState(false)
  const [chunkNumber, _setChunkNumber] = useState(0)
  const [step, _setStep] = useState<STEPS>(STEPS.PROCESS_STEP_CONNECTED)
  const [isInitialized, setIsInitialized] = useState(false)

  const chunkNumberRef = useRef<number>(chunkNumber)
  const stepRef = useRef<STEPS>(step)

  const setChunkNumber = syncStateWithRef(_setChunkNumber, chunkNumberRef)
  const setStep = syncStateWithRef(_setStep, stepRef)

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE) || 1

  if (!isInitialized) {
    setIsInitialized(true)
    peer.on('close', () => {
      setStatus(CONN_STATUSES.CONN_STATUS_CLOSE)
    })
    peer.on('error', () => {
      setStatus(CONN_STATUSES.CONN_STATUS_ERROR)
    })
    peer.on('data', (data: unknown) => {
      const message = data as MessageEvent
      const chunkNumber = chunkNumberRef.current
      const step = stepRef.current

      const sendChunk = (n: number) => {
        // step 3: send chunk
        file.slice(
          CHUNK_SIZE * n,
          Math.min(CHUNK_SIZE * (n + 1), file.size)
        ).arrayBuffer().then((chunk) => {
          peer.send({
            type: STEPS.PROCESS_STEP_CHUNK,
            chunk,
            chunkNumber: n,
          })
        })
      }

      switch (message.type) {
        case `${STEPS.PROCESS_STEP_INIT}-ack`:
          if (step === STEPS.PROCESS_STEP_INIT) {
            setStep(STEPS.PROCESS_STEP_INFO)
            // step 2: send file info
            peer.send({
              type: STEPS.PROCESS_STEP_INFO,
              filesize: file.size,
              filename: file.name,
              filetype: file.type,
              chunks: totalChunks,
            })
          }
          break

        case `${STEPS.PROCESS_STEP_INFO}-ack`:
          if (step === STEPS.PROCESS_STEP_INFO) {
            setStep(STEPS.PROCESS_STEP_CHUNK)
            sendChunk(0)
          }
          break

        case `${STEPS.PROCESS_STEP_CHUNK}-ack`:
          if (step === STEPS.PROCESS_STEP_CHUNK) {
            const newChunkNumber = chunkNumber + 1
            setChunkNumber(newChunkNumber)
            if (newChunkNumber >= totalChunks) {
              setStep(STEPS.PROCESS_STEP_COMPLETE)
            } else {
              sendChunk(newChunkNumber)
            }
          }
          break

        default:
          break
      }
    })
  }

  const handleStart = useCallback(() => {
    if (step === STEPS.PROCESS_STEP_CONNECTED && !start) {
      setStart(true)
      setStep(STEPS.PROCESS_STEP_INIT)
      peer.send({ type: STEPS.PROCESS_STEP_INIT })
    }
  }, [peer, setStart, start, step, setStep])

  let icon = faUser
  if (step === STEPS.PROCESS_STEP_COMPLETE) {
    icon = faUserCheck
  } else if (
    status === CONN_STATUSES.CONN_STATUS_CLOSE ||
    status === CONN_STATUSES.CONN_STATUS_ERROR
  ) {
    icon = faUserSlash
  }

  let progress = (100 * chunkNumber) / totalChunks
  if (step !== STEPS.PROCESS_STEP_COMPLETE) {
    progress = Math.min(progress, 99.99) // dont show 100% because of rounding if not complete
  }

  return (
    <div className="peer">
      <FontAwesomeIcon className="user-icon" icon={icon} />
      {status === CONN_STATUSES.CONN_STATUS_OPEN && !start && (
        <button onClick={handleStart}>Start</button>
      )}
      {status === CONN_STATUSES.CONN_STATUS_OPEN && start && chunkNumber <= 0 && (
        <div>
          <div>Waiting for peer</div>
          <FontAwesomeIcon className="loading-icon" icon={faSpinner} />
        </div>
      )}
      {start && chunkNumber > 0 && (
        <div className="progress">
          <div className="progress-inner" style={{ width: `${progress}%` }} />
          <label>{Math.round(progress * 100) / 100}%</label>
        </div>
      )}
      {step === STEPS.PROCESS_STEP_COMPLETE && <div>Completed</div>}
      {step !== STEPS.PROCESS_STEP_COMPLETE &&
        status === CONN_STATUSES.CONN_STATUS_CLOSE && <div>Disconnected</div>}
      {step !== STEPS.PROCESS_STEP_COMPLETE &&
        status === CONN_STATUSES.CONN_STATUS_ERROR && <div>Error</div>}
    </div>
  )
}

export default Peer

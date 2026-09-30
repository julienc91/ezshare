import React from 'react'
import { formatSize } from './utils'

const Progress: React.FC<{ progress: number; size: number }> = ({
  progress,
  size,
}) => (
  <div className="progress">
    <div
      className="progress-bar"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-inner" style={{ width: `${progress}%` }} />
    </div>
    <div className="progress-meta">
      <span className="progress-percent">{Math.floor(progress)}%</span>
      <span className="muted">
        {formatSize((size * progress) / 100)} of {formatSize(size)}
      </span>
    </div>
  </div>
)

export default Progress

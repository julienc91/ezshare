import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { formatSize, getFileIcon } from './utils'

const FileCard: React.FC<{ file: File; children?: React.ReactNode }> = ({
  file,
  children,
}) => (
  <div className="card raised file-card">
    <span className="file-badge">
      <FontAwesomeIcon icon={getFileIcon(file.type)} />
    </span>
    <div className="file-details">
      <div className="file-name" title={file.name}>
        {file.name}
      </div>
      <div className="file-meta">
        {[formatSize(file.size), file.type].filter(Boolean).join(' · ')}
      </div>
    </div>
    {children}
  </div>
)

export default FileCard

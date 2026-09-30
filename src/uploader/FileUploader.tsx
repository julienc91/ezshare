import React from 'react'
import Dropzone from 'react-dropzone'
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const FileUploader: React.FC<{
  onFileSelected: (file: File) => void
}> = ({ onFileSelected }) => (
  <Dropzone onDropAccepted={(files) => onFileSelected(files[0])}>
    {({ getRootProps, getInputProps, isDragActive }) => (
      <div
        {...getRootProps({
          className: 'dropzone' + (isDragActive ? ' active' : ''),
        })}
      >
        <input {...getInputProps()} />
        <span className="dropzone-icon">
          <FontAwesomeIcon icon={faArrowUpFromBracket} />
        </span>
        <div className="dropzone-text pointer">
          Drag the file you want to share here
        </div>
        <div className="dropzone-text touch">Tap to pick the file to share</div>
        <div className="dropzone-or">or</div>
        <button type="button" className="button">
          Select a file
        </button>
      </div>
    )}
  </Dropzone>
)

export default FileUploader

import React from 'react'
import Dropzone from 'react-dropzone'

const FileUploader: React.FC<{
  onFileSelected: (file: File) => void
}> = ({ onFileSelected }) => (
  <Dropzone onDropAccepted={(files) => onFileSelected(files[0])}>
    {({ getRootProps, getInputProps }) => (
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        <p>
          Drag the file you want to share or...
          <button>Select a file</button>
        </p>
      </div>
    )}
  </Dropzone>
)

export default FileUploader

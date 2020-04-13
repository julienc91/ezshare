import React from 'react'
import Dropzone from 'react-dropzone'

export default class FileUploader extends React.Component {
  render () {
    const { onFileSelected } = this.props
    return (
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
  }
}

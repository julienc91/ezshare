import React from 'react'
import { IconDefinition } from '@fortawesome/free-brands-svg-icons'
import {
  faFile,
  faFileAlt,
  faFileArchive,
  faFileAudio,
  faFileCode,
  faFileImage,
  faFilePdf,
  faFileVideo,
} from '@fortawesome/free-regular-svg-icons'

export const formatSize = (size: number): string => {
  let unit
  if (size < 1024) {
    unit = 'B'
  } else if (size < 1024 ** 2) {
    unit = 'kB'
    size = Math.round(size / 1024)
  } else if (size < 1024 ** 3) {
    unit = 'MB'
    size = Math.round(size / 1024 ** 2)
  } else {
    unit = 'GB'
    size = Math.round(size / 1024 ** 3)
  }
  return `${size}${unit}`
}

export const getFileIcon = (mime: string): IconDefinition => {
  let icon
  mime = mime || ''
  if (mime.startsWith('audio')) {
    icon = faFileAudio
  } else if (mime.startsWith('image')) {
    icon = faFileImage
  } else if (mime.startsWith('video')) {
    icon = faFileVideo
  } else {
    switch (mime) {
      case 'text/markdown':
      case 'text/plain':
        icon = faFileAlt
        break
      case 'application/x-rar-compressed':
      case 'application/x-tar':
      case 'application/zip':
      case 'application/7z':
        icon = faFileArchive
        break
      case 'application/pdf':
        icon = faFilePdf
        break
      case 'text/css':
      case 'text/html':
      case 'application/javascript':
      case 'application/json':
      case 'application/sh':
      case 'application/ts':
      case 'application/xhtml':
      case 'application/xml':
      case 'text/x-python':
      case 'text/x-shellscript':
        icon = faFileCode
        break
      default:
        icon = faFile
        break
    }
  }
  return icon
}

export const splitFileExtension = (filename: string): [string, string] => {
  filename = filename || ''
  let extension = ''
  if (filename.includes('.')) {
    extension = /(?:\.([^.]+))?$/.exec(filename)?.[0] || ''
    filename = filename.slice(0, -extension.length)
  }
  return [filename, extension]
}

export const syncStateWithRef = <T>(
  setState: React.Dispatch<React.SetStateAction<T>>,
  ref: React.MutableRefObject<T>
) => {
  return (value: T) => {
    setState(value)
    ref.current = value
  }
}

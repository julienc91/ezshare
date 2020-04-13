export const formatSize = (size) => {
  let unit
  if (size < 1024) {
    unit = 'B'
  } else if (size < 1024 ** 2) {
    unit = 'kB'
    size = Math.round(size / 1024)
  } else if (size < 1024 ** 3) {
    unit = 'MB'
    size = Math.round(size / (1024 ** 2))
  } else {
    unit = 'GB'
    size = Math.round(size / (1024 ** 3))
  }
  return `${size}${unit}`
}

export const getFileIcon = (mime) => {
  let icon
  mime = mime || ''
  if (mime.startsWith('audio')) {
    icon = 'far fa-file-music'
  } else if (mime.startsWith('image')) {
    icon = 'far fa-file-image'
  } else if (mime.startsWith('video')) {
    icon = 'far fa-file-video'
  } else {
    switch (mime) {
      case 'text/markdown':
      case 'text/plain':
        icon = 'far fa-file-alt'
        break
      case 'application/x-rar-compressed':
      case 'application/x-tar':
      case 'application/zip':
      case 'application/7z':
        icon = 'far fa-file-archive'
        break
      case 'application/pdf':
        icon = 'far fa-file-pdf'
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
        icon = 'far fa-file-code'
        break
      default:
        icon = 'far fa-file'
        break
    }
  }
  return icon
}

export const splitFileExtension = filename => {
  filename = filename || ''
  let extension = ''
  if (filename.includes('.')) {
    extension = (/(?:\.([^.]+))?$/).exec(filename)[0] || ''
    filename = filename.slice(0, -(extension.length))
  }
  return [filename, extension]
}

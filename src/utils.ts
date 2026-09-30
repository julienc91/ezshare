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

// Calls f at most once every intervalMs, dropping the calls in between
export const throttle = <A extends unknown[]>(
  f: (...args: A) => void,
  intervalMs: number,
): ((...args: A) => void) => {
  let lastCall = -Infinity
  return (...args: A) => {
    const now = performance.now()
    if (now - lastCall >= intervalMs) {
      lastCall = now
      f(...args)
    }
  }
}

// Crockford's base32 alphabet: no I, L, O or U, which are easily confused when typed by hand
const SHARE_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
// 16 characters of 5 bits each: 80 bits, too many to brute force from the relay's topic hashes
const SHARE_CODE_LENGTH = 16

export const generateShareCode = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(SHARE_CODE_LENGTH))
  // 256 is a multiple of 32, so the modulo doesn't bias the distribution
  const code = Array.from(
    bytes,
    (byte) => SHARE_CODE_ALPHABET[byte % SHARE_CODE_ALPHABET.length],
  ).join('')
  return code.match(/.{4}/g)!.join('-')
}

// Maps the ways a share code can be typed by hand to a single room id
export const normalizeShareCode = (code: string): string =>
  code
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')

export enum CLIENT_STATUSES {
  CLIENT_STATUS_OPENING = 'opening',
  CLIENT_STATUS_OPEN = 'open',
  CLIENT_STATUS_CLOSE = 'close',
  CLIENT_STATUS_ERROR = 'error',
}

export enum CONN_STATUSES {
  CONN_STATUS_OPENING = 'opening',
  CONN_STATUS_OPEN = 'open',
  CONN_STATUS_CLOSE = 'close',
  CONN_STATUS_ERROR = 'error',
}

export enum STEPS {
  PROCESS_STEP_CONNECTED = 'connected',
  PROCESS_STEP_INIT = 'init',
  PROCESS_STEP_INFO = 'info',
  PROCESS_STEP_CHUNK = 'chunk',
  PROCESS_STEP_COMPLETE = 'complete',
}

const relayUrls = (import.meta.env.VITE_RELAY_URLS ?? '')
  .split(',')
  .map((url: string) => url.trim())
  .filter(Boolean)

export const trysteroConfig = {
  appId: 'ezshare',
  ...(relayUrls.length ? { relayConfig: { urls: relayUrls } } : {}),
}

// Minimum delay between two progress updates, to avoid re-rendering on every chunk
export const PROGRESS_UPDATE_INTERVAL_MS = 100

// Files are sent as a sequence of slices of this size, so they never have to fit in memory at once
export const FILE_SLICE_SIZE = 4 * 1024 ** 2

// Delay after which a downloader alone in its room is told nobody shares with this code
export const JOIN_TIMEOUT_MS = 15_000

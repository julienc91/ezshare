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
  ...(relayUrls.length ? { relayUrls } : {}),
}

import React, { useCallback, useState } from 'react'
import { faCopy } from '@fortawesome/free-regular-svg-icons'
import { faCheck, faShareNodes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { QRCodeCanvas } from 'qrcode.react'

const DownloadLink: React.FC<{ url: string }> = ({ url }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    })
  }, [url, setCopied])

  // The Web Share API is mostly available on mobile browsers
  const canShare = !!navigator.canShare?.({ url })
  const handleShare = useCallback(() => {
    // Rejected when the user dismisses the share sheet
    navigator.share({ url }).catch(() => {})
  }, [url])

  return (
    <div className="share-panel">
      <div className="card link-card">
        <label htmlFor="download-link">Your download link</label>
        <div className="link-row">
          <input
            id="download-link"
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
          />
          <div className="link-actions">
            <button className="button" onClick={handleCopy}>
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
              {copied ? 'Copied' : 'Copy'}
            </button>
            {canShare && (
              <button className="button secondary" onClick={handleShare}>
                <FontAwesomeIcon icon={faShareNodes} />
                Share
              </button>
            )}
          </div>
        </div>
        <p>
          This link will be valid as long as your tab is open.{' '}
          <span className="touch-only">
            On a phone, keep ezshare in the foreground during the transfer.
          </span>
        </p>
      </div>
      <div className="card qr-card">
        <div className="qr-code">
          <QRCodeCanvas size={190} value={url} />
        </div>
        <span>Scan to download</span>
      </div>
    </div>
  )
}

export default DownloadLink

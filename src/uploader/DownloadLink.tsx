import React, { useCallback, useState } from 'react'
import { faCopy } from '@fortawesome/free-regular-svg-icons'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { QRCodeCanvas } from 'qrcode.react'

const DownloadLink: React.FC<{ id: string; url: string }> = ({ id, url }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    })
  }, [url, setCopied])

  return (
    <section className="download-link">
      <p>This link will be valid as long as your tab is open.</p>
      <pre>
        <a href={url} target="_blank" rel="noopener noreferrer">
          {id}
        </a>
        {copied ? (
          <FontAwesomeIcon icon={faCheck} />
        ) : (
          <FontAwesomeIcon icon={faCopy} onClick={handleCopy} />
        )}
      </pre>
      <p>
        <QRCodeCanvas size={190} value={url} />
      </p>
    </section>
  )
}

export default DownloadLink

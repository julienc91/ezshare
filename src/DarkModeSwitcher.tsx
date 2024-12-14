import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'

const getDefaultTheme = () => {
  let theme = 'light'
  const localStorageTheme = localStorage.getItem('theme')
  if (localStorageTheme === 'light' || localStorageTheme === 'dark') {
    theme = localStorageTheme
  } else if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    theme = 'dark'
  }
  return theme
}

const DarkModeSwitcher: React.FC = () => {
  const [theme, setTheme] = useState(getDefaultTheme())

  const handleClick = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  useEffect(() => {
    if (theme == 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [theme])

  const icon = theme === 'light' ? faSun : faMoon
  return (
    <button
      className="theme-selector"
      title="Change theme"
      onClick={handleClick}
    >
      <FontAwesomeIcon icon={icon} />
    </button>
  )
}

export default DarkModeSwitcher

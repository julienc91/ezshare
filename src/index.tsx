import React  from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const rootElement = document.getElementById('root') as Element
const root = createRoot(rootElement)

root.render(<App />);

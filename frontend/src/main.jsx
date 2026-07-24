import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './utils/clientErrorReporter.js'
import './index.css'
import { startReleaseVersionMonitor } from './utils/releaseVersionMonitor.js'

startReleaseVersionMonitor()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

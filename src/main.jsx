import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { PinProvider } from './utils/PinContext'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <PinProvider>
        <App />
      </PinProvider>
    </HashRouter>
  </React.StrictMode>
)

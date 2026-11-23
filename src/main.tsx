import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AppDialogHost from './shared/components/AppDialog'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    {/* The app's own alert / confirm dialogs (instead of the browser's) */}
    <AppDialogHost />
  </React.StrictMode>,
)

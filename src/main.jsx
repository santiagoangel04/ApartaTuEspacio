import React from 'react'
import ReactDOM from 'react-dom/client'
// Los estilos globales se cargan primero para que los de cada componente puedan sobrescribirlos.
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

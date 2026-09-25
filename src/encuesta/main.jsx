import React from 'react'
import ReactDOM from 'react-dom/client'
import '../index.css'
import NpsPage from './NpsPage.jsx'

// Página independiente de la landing: solo se llega a ella con el enlace /encuesta/.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NpsPage />
  </React.StrictMode>,
)

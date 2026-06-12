import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { Toaster } from 'sonner'
import './index.css'

const initialTheme = localStorage.getItem('invtrack-theme') || 'dark'
document.documentElement.setAttribute('data-theme', initialTheme)

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <LanguageProvider>
      <AuthProvider>
        <App />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </LanguageProvider>
  </BrowserRouter>
)

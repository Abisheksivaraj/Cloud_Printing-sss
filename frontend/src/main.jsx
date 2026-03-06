import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './ThemeContext'
import { LanguageProvider } from './LanguageContext'
import { AlertProvider } from './AlertContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AlertProvider>
          <App />
        </AlertProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);

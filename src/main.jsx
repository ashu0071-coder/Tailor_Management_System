import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'


// Development-only: surface unhandled promise rejections for easier debugging
if (import.meta.env.DEV) {
  window.addEventListener('unhandledrejection', (e) => {
    // Log the rejection reason and stack (if available)
    console.error('Unhandled promise rejection:', e.reason || e);
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)




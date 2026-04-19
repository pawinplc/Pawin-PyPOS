import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { invoke } from '@tauri-apps/api/core'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
  </>
)

document.addEventListener('DOMContentLoaded', function() {
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  });

  // Handoff to main window by closing splashscreen after 1.8s
  setTimeout(() => {
    try {
      invoke('close_splashscreen').catch(e => console.warn('Handoff error:', e));
    } catch(err) {
      // Ignore if running on browser instead of Tauri desktop
      console.warn('Tauri API not found (likely running in web mode)');
    }
  }, 1800);
})

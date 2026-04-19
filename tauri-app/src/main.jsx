import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
  </>
)

// Handle Splash Screen Handoff — calls Rust backend for reliability
if (window.__TAURI_INTERNALS__) {
  import('@tauri-apps/api/core').then(({ invoke }) => {
    setTimeout(() => {
      invoke('close_splashscreen').catch(console.error);
    }, 1800);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })
})

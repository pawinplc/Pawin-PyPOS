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

// Handle Splash Screen Handoff (Tauri 2.0)
if (window.__TAURI_INTERNALS__) {
  import('@tauri-apps/api/webviewWindow').then(({ getAllWebviewWindows }) => {
    setTimeout(async () => {
      const windows = await getAllWebviewWindows();
      const splash = windows.find(w => w.label === 'splashscreen');
      const main = windows.find(w => w.label === 'main');
      
      if (splash && main) {
        await main.show();
        await splash.close();
      }
    }, 1500); // 1.5s delay for a premium feel
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })
})

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { migrateLegacySettings } from '@/lib/settingsStore'
import { setupNativeApp } from '@/lib/nativeBridge'

// Wire up native shell (back button, status bar, splash) on the packaged app
setupNativeApp();

// Migrate old dev_* localStorage keys to new system
migrateLegacySettings();

// Apply dark mode instantly before render (from new key, fallback old key)
try {
  const newDark = localStorage.getItem("devs_dark_mode");
  const oldDark = localStorage.getItem("dev_dark_mode");
  if ((newDark || oldDark) === "true") {
    document.documentElement.classList.add("dark");
  }
} catch(e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register Service Worker for PWA (installable app + offline support)
// Skip in dev to prevent stale Vite cache issues; unregister stale dev workers
if ("serviceWorker" in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}
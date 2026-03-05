import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'

// Prevent unhandled promise rejections from crashing the app (white screen)
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled rejection:", event.reason);
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

window.addEventListener("vite:preloadError", (event: any) => {
  console.error("Vite preload error:", event?.payload || event);
  event?.preventDefault?.();

  const reloadKey = "brillarte_vite_preload_reload";
  let lastReload = 0;

  try {
    lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
  } catch {
    lastReload = 0;
  }

  const now = Date.now();
  if (!lastReload || now - lastReload > 30000) {
    try {
      sessionStorage.setItem(reloadKey, String(now));
    } catch {
      // Ignore storage errors on restrictive browsers
    }
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

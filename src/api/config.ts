/// <reference types="vite/client" />

export const API_BASE_URL = import.meta.env.DEV
  ? ''
  : 'https://grocyprobackend-2.onrender.com';

export const warmUpServer = async () => {
  try {
    // Always hit the real backend directly for warm-up (bypasses proxy)
    await fetch('https://grocyprobackend-2.onrender.com/api/health', {
      method: 'GET',
      mode: 'no-cors', // avoids CORS error even without the header
    });
  } catch (_) {
    // Silently ignore
  }
};

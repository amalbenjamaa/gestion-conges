/**
 * URL du backend (sans slash final).
 * Production : dÃ©finir sur Vercel â†’ VITE_API_URL = https://ton-backend.up.railway.app
 */
export const API_BASE_URL = String(
  import.meta.env.VITE_API_URL || 'https://test.bankbot.uteek.net'
).replace(/\/$/, '');

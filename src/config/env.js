/**
 * Application Environment Configuration
 * Centralized configuration manager for Vite environment variables.
 */

export const env = {
  // Application Mode ('development' | 'production' | 'test')
  mode: import.meta.env.MODE || 'development',
  isProd: import.meta.env.PROD || false,
  isDev: import.meta.env.DEV || true,

  // App Metadata
  appName: import.meta.env.VITE_APP_NAME || 'FIX 707 Form',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',

  // API Endpoints
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',

  // Customer Support Contacts
  whatsappSupportNumber: import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER || '6281277208270',
  whatsappSupportUrl: `https://wa.me/${import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER || '6281277208270'}`
}

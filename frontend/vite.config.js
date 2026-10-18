import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin para inyectar automáticamente el tag de Google AdSense en el <head> de index.html
function googleAdSensePlugin(rawClientId) {
  const trimmed = (rawClientId || '').trim()
  const normalized = trimmed.startsWith('pub-') ? `ca-${trimmed}` : trimmed
  const isValid = /^ca-pub-\d{10,20}$/.test(normalized) && !normalized.includes('0000000000000000')

  return {
    name: 'vite-plugin-google-adsense',
    transformIndexHtml(html) {
      if (!isValid) return html
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: {
              name: 'google-adsense-account',
              content: normalized,
            },
            injectTo: 'head',
          },
          {
            tag: 'script',
            attrs: {
              async: true,
              src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${normalized}`,
              crossorigin: 'anonymous',
              'data-adsense-script': 'true',
            },
            injectTo: 'head',
          },
        ],
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const adsenseClientId = env.VITE_ADSENSE_CLIENT_ID || env.ADSENSE_CLIENT_ID || ''

  return {
    plugins: [
      react(),
      googleAdSensePlugin(adsenseClientId),
    ],
  }
})


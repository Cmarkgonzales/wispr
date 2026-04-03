import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Escape text for safe use inside double-quoted HTML attributes. */
function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const htmlEntries = [
  ['main', 'index.html'],
  ['playground', 'playground.html'],
  ['support', 'support.html'],
  ['guides_index', 'guides/index.html'],
  ['guide_css', 'guides/cursor-trail-effect-css.html'],
  ['guide_react', 'guides/react-cursor-trail-component.html'],
  ['guide_vue_angular', 'guides/vue-angular-cursor-trail.html'],
]

function analyticsHeadInjectionPlugin(env) {
  const gaId = (env.VITE_GA_MEASUREMENT_ID || '').trim()
  const gsc = (env.VITE_GOOGLE_SITE_VERIFICATION || '').trim()

  return {
    name: 'wispr-analytics-head',
    transformIndexHtml(html) {
      if (!gaId && !gsc) return html

      const chunks = []
      if (gsc) {
        chunks.push(
          `<meta name="google-site-verification" content="${escapeHtmlAttr(gsc)}" />`,
        )
      }
      if (gaId) {
        const safeId = escapeHtmlAttr(gaId)
        const idJson = JSON.stringify(gaId)
        chunks.push(
          `<script async src="https://www.googletagmanager.com/gtag/js?id=${safeId}"></script>`,
          `<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', ${idJson}, { anonymize_ip: true });
</script>`,
        )
      }

      return html.replace('</head>', `${chunks.join('\n')}\n</head>`)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const rollupInput = Object.fromEntries(
    htmlEntries.map(([key, rel]) => [key, resolve(__dirname, rel)]),
  )

  return {
    root: '.',
    base: '/',
    plugins: [analyticsHeadInjectionPlugin(env)],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: rollupInput,
      },
    },
    server: {
      port: 5173,
      open: true,
    },
  }
})

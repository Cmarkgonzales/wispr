#!/usr/bin/env node
/**
 * Post-deploy SEO checklist: sitemap URL for Google Search Console,
 * optional IndexNow submission (Bing and partners), and URL list for manual
 * "Request indexing" in GSC (URL Inspection).
 *
 * Env (optional):
 *   SITE_ORIGIN — default https://wispr.dev
 *   INDEXNOW_KEY — secret key; host INDEXNOW_KEY.txt at SITE_ORIGIN root
 *   INDEXNOW_HOST — default hostname from SITE_ORIGIN (e.g. wispr.dev)
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://wispr.dev').replace(/\/$/, '')
const INDEXNOW_KEY = (process.env.INDEXNOW_KEY || '').trim()
const INDEXNOW_HOST =
  process.env.INDEXNOW_HOST?.trim() || new URL(SITE_ORIGIN).hostname

function parseSitemapLocs(xml) {
  const locs = []
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi
  let m
  while ((m = re.exec(xml)) !== null) locs.push(m[1].trim())
  return locs
}

async function postIndexNow(urlList) {
  const endpoint = 'https://api.indexnow.org/indexnow'
  const body = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
    urlList,
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  return { ok: res.ok, status: res.status, text }
}

async function main() {
  const sitemapPath = join(root, 'public', 'sitemap.xml')
  let xml
  try {
    xml = readFileSync(sitemapPath, 'utf8')
  } catch {
    console.error('Could not read public/sitemap.xml')
    process.exit(1)
  }

  const urls = parseSitemapLocs(xml)
  const sitemapUrl = `${SITE_ORIGIN}/sitemap.xml`

  console.log('--- Wispr SEO launch ---\n')
  console.log('1) Google Search Console — property: add URL-prefix or domain property for', SITE_ORIGIN)
  console.log('2) Sitemaps — submit:', sitemapUrl)
  console.log('   Open: https://search.google.com/search-console\n')
  console.log('3) URL Inspection — request indexing for key URLs (paste each):')
  for (const u of urls) console.log('   ', u)
  console.log('\n4) GA4 — set VITE_GA_MEASUREMENT_ID before build; verify Realtime after deploy.')
  console.log('5) GSC verification meta — set VITE_GOOGLE_SITE_VERIFICATION before build.\n')

  if (!INDEXNOW_KEY) {
    console.log(
      'IndexNow: skipped (set INDEXNOW_KEY and publish ' +
        `${SITE_ORIGIN}/<key>.txt containing the key as plain text)\n`,
    )
    return
  }

  console.log('IndexNow: submitting', urls.length, 'URL(s)…')
  try {
    const { ok, status, text } = await postIndexNow(urls)
    if (ok) console.log('IndexNow: OK', status)
    else console.error('IndexNow:', status, text.slice(0, 500))
  } catch (err) {
    console.error('IndexNow error:', err.message)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

// Validate the generated preview without running a browser or calling APIs.
import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve, join, dirname, extname } from 'node:path'
import { JSDOM } from 'jsdom'

const ROOT = resolve('.pages-dist')
const BASE = '/express-homework-05-passport-sessions'
const ORIGIN = 'https://andrii-dolzhenko.github.io'
const pages = []

async function crawl(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) await crawl(full)
    else if (entry.name === 'index.html') pages.push(full)
  }
}

async function exists(file) {
  try { return (await stat(file)).isFile() } catch { return false }
}

async function main() {
  await crawl(ROOT)
  if (pages.length < 6) throw new Error('Too few HTML preview pages: ' + pages.length)

  for (const file of pages) {
    const html = await readFile(file, 'utf8')
    const dom = new JSDOM(html)
    const doc = dom.window.document

    if (!doc.querySelector('.preview-banner')) {
      throw new Error('Missing static preview disclaimer: ' + file)
    }
    if (doc.querySelector('script[src$="/assets/js/demo.js"]')) {
      throw new Error('Live API script found in static preview: ' + file)
    }
    if (doc.querySelector('form.theme-form')) {
      throw new Error('Server-dependent theme form found: ' + file)
    }

    for (const element of doc.querySelectorAll('[href], [src]')) {
      for (const attr of ['href', 'src']) {
        const value = element.getAttribute(attr)
        if (!value?.startsWith(BASE + '/')) continue

        const url = new URL(value, ORIGIN)
        const rel = decodeURIComponent(url.pathname.slice(BASE.length + 1))
        const target = join(ROOT, rel)
        const path = rel.endsWith('/') || !extname(rel) ? join(target, 'index.html') : target
        if (!(await exists(path))) {
          throw new Error('Broken preview URL in ' + file + ': ' + value)
        }
      }
    }
  }

  const dashboard = new JSDOM(await readFile(join(ROOT, 'index.html'), 'utf8')).window.document
  for (const id of ['#auth-submit', '#check-access', '#session-check']) {
    if (!dashboard.querySelector(id)?.disabled) {
      throw new Error('Live action not disabled in preview: ' + id)
    }
  }
  for (const path of ['demo/index.html', 'demo/icon/index.html', 'users/index.html', 'articles/index.html']) {
    if (!(await exists(join(ROOT, path)))) throw new Error('Missing static page: ' + path)
  }

  console.log('Verified ' + pages.length + ' HTML pages, disclaimers, disabled actions, and local links.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

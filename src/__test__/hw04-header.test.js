import { describe, expect, test } from 'vitest'
import request from 'supertest'
import { app } from '../server.mjs'

const routes = [
  ['/demo', 'Demo'],
  ['/demo/icon', 'Demo'],
  ['/users', 'Users'],
  ['/users/test-user-1', 'Users'],
  ['/articles', 'Articles'],
  ['/articles/test-article-1', 'Articles'],
]

describe('HW05 consistent responsive header', () => {
  test.each(routes)('%s uses the same ordered links and theme form', async (path, current) => {
    const response = await request(app).get(path).set('Accept', 'text/html')
    expect(response.status).toBe(200)
    const nav = response.text.match(/<nav class="site-nav"[^>]*>[\s\S]*?<\/nav>/)?.[0]
    expect(nav).toBeTruthy()
    const labels = [...nav.matchAll(/<a class="nav-link"[^>]*>([^<]*)<\/a>/g)].map((match) => match[1])
    expect(labels).toEqual(['Demo', 'Users', 'Articles'])
    expect(nav).toContain(`href="${current === 'Demo' ? '/demo' : current === 'Users' ? '/users' : '/articles'}" aria-current="page"`)
    expect(response.text).toContain('action="/theme"')
    expect(response.text).toContain('aria-label="Choose color theme"')
    expect(response.text).toContain('PASSPORT + SESSIONS')
  })

  test('theme form on /demo redirects safely back to /demo', async () => {
    const response = await request(app).post('/theme').type('form').send({ theme: 'dark', next: '/demo' })
    expect(response.status).toBe(303)
    expect(response.headers.location).toBe('/demo')
  })

  test('theme form on /demo/icon redirects safely back to /demo/icon', async () => {
    const response = await request(app).post('/theme').type('form').send({ theme: 'dark', next: '/demo/icon' })
    expect(response.status).toBe(303)
    expect(response.headers.location).toBe('/demo/icon')
  })

  test('icon preview separates inline text from link', async () => {
    const response = await request(app).get('/demo/icon')
    expect(response.status).toBe(200)
    expect(response.text).toMatch(/You can also\s+<a class="text-link"/)
    expect(response.text).not.toContain('also<a')
  })

  test('header CSS includes medium and small responsive layouts', async () => {
    const response = await request(app).get('/assets/css/styles.css')
    expect(response.status).toBe(200)
    expect(response.text).toContain('grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr)')
    expect(response.text).toContain('@media (max-width: 1050px)')
    expect(response.text).toContain('@media (max-width: 540px)')
  })

  test('demo JavaScript keeps the header theme buttons in sync', async () => {
    const response = await request(app).get('/assets/js/demo.js')
    expect(response.status).toBe(200)
    expect(response.text).toContain("document.querySelectorAll('.theme-form .theme-btn')")
  })

  test('cookie-selected dark theme is reflected in Demo header', async () => {
    const agent = request.agent(app)
    await agent.post('/theme').set('Accept', 'application/json').send({ theme: 'dark' })
    const response = await agent.get('/demo')
    expect(response.status).toBe(200)
    expect(response.text).toContain('data-theme="dark"')
    expect(response.text).toMatch(/value="dark"[^>]*aria-pressed="true"[^>]*>Dark<\/button>/)
  })
})

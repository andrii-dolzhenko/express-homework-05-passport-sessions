import { describe, expect, test } from 'vitest'
import request from 'supertest'
import { app } from '../server.mjs'

describe('HW05 local interactive demo', () => {
  test('GET /demo renders an HTML dashboard without authentication', async () => {
    const response = await request(app).get('/demo')
    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/^text\/html/)
    expect(response.text).toContain('Authentication, made visible.')
    expect(response.text).toContain('data-theme="light"')
  })

  test('includes favicon, stylesheet, and client script', async () => {
    const response = await request(app).get('/demo')
    expect(response.text).toContain('href="/favicon.ico"')
    expect(response.text).toContain('href="/assets/css/demo.css"')
    expect(response.text).toContain('src="/assets/js/demo.js"')
  })

  test('provides registration, login, logout, theme, and protected route controls', async () => {
    const response = await request(app).get('/demo')
    for (const marker of ['id="auth-form"', 'id="demo-logout"', 'id="check-access"',
      'data-auth-mode="register"', 'data-auth-mode="login"', 'data-theme-choice="dark"']) {
      expect(response.text).toContain(marker)
    }
  })

  test('renders the theme stored in the browser cookie', async () => {
    const agent = request.agent(app)
    await agent.post('/theme').set('Accept', 'application/json').send({ theme: 'dark' })
    const response = await agent.get('/demo')
    expect(response.status).toBe(200)
    expect(response.text).toContain('data-theme="dark"')
    expect(response.text).toContain('data-theme-choice="dark"')
  })

  test('serves the demo JavaScript from express.static', async () => {
    const response = await request(app).get('/assets/js/demo.js')
    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/javascript/)
    expect(response.text).toContain("'/protected'")
    expect(response.text).toContain("'/auth/register'")
    expect(response.text).toContain("'/auth/logout'")
  })

  test('serves responsive demo CSS while preserving JSON API routes', async () => {
    const css = await request(app).get('/assets/css/demo.css')
    expect(css.status).toBe(200)
    expect(css.text).toContain('@media (max-width: 650px)')
    const api = await request(app).get('/users').set('Accept', 'application/json')
    expect(api.status).toBe(200)
    expect(api.body).toBeInstanceOf(Array)
  })
})


describe('HW05 cross-page navigation', () => {
  const pages = [
    '/users',
    '/users/test-user-1',
    '/articles',
    '/articles/test-article-1',
  ]

  test.each(pages)('%s links back to the interactive demo', async (url) => {
    const response = await request(app).get(url).set('Accept', 'text/html')
    expect(response.status).toBe(200)
    expect(response.text).toContain('href="/demo"')
    expect(response.text).toContain('aria-label="Express Studio demo home"')
    expect(response.text).toContain('>Demo</a>')
  })

  test('demo icon link opens the navigable preview instead of the raw file', async () => {
    const response = await request(app).get('/demo')
    expect(response.status).toBe(200)
    expect(response.text).toContain('href="/demo/icon"')
  })

  test('favicon preview has a back link and displays the real favicon', async () => {
    const response = await request(app).get('/demo/icon')
    expect(response.status).toBe(200)
    expect(response.text).toContain('href="/demo"')
    expect(response.text).toContain('src="/favicon.ico"')
    expect(response.text).toContain('Back to interactive demo')
  })

  test('favicon preview retains the selected cookie theme', async () => {
    const agent = request.agent(app)
    await agent.post('/theme').set('Accept', 'application/json').send({ theme: 'dark' })
    const response = await agent.get('/demo/icon')
    expect(response.status).toBe(200)
    expect(response.text).toContain('data-theme="dark"')
  })
})

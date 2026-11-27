import { describe, expect, test } from 'vitest'
import request from 'supertest'
import { app } from '../server.mjs'

describe('Session visits', () => {
  test('sets an HttpOnly session cookie and counts repeated visits', async () => {
    const agent = request.agent(app)
    const first = await agent.get('/session')
    expect(first.status).toBe(200)
    expect(first.text).toBe('Visits: 1')
    expect(first.headers['content-type']).toMatch(/^text\/plain/)
    expect(first.headers['set-cookie']?.[0]).toContain('hw05.sid=')
    expect(first.headers['set-cookie']?.[0]).toContain('HttpOnly')
    expect(first.headers['set-cookie']?.[0]).toContain('SameSite=Lax')
    const second = await agent.get('/session')
    expect(second.status).toBe(200)
    expect(second.text).toBe('Visits: 2')
  })

  test('a request without the cookie starts its own session', async () => {
    const first = await request(app).get('/session')
    const other = await request(app).get('/session')
    expect(first.text).toBe('Visits: 1')
    expect(other.text).toBe('Visits: 1')
  })

  test('DELETE /session resets only the visits counter', async () => {
    const agent = request.agent(app)
    await agent.get('/session')
    const deleted = await agent.delete('/session')
    expect(deleted.status).toBe(204)
    expect(deleted.text).toBeFalsy()
    const restarted = await agent.get('/session')
    expect(restarted.status).toBe(200)
    expect(restarted.text).toBe('Visits: 1')
  })

  test('ordinary CRUD requests do not create session cookies', async () => {
    const response = await request(app).get('/users')
    expect(response.status).toBe(200)
    expect(response.headers['set-cookie']).toBeUndefined()
  })
})

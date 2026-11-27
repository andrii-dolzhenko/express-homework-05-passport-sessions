import { randomUUID } from 'node:crypto'
import { describe, expect, test } from 'vitest'
import request from 'supertest'
import { app } from '../server.mjs'
import { accounts } from '../data/accounts.mjs'

function email() {
  return `demo_${randomUUID().replace(/-/g, '').slice(0, 16)}@example.com`
}

async function registerUser(agent, userEmail, password = 'SafePass123!') {
  return agent.post('/auth/register').send({ email: userEmail, password })
}

describe('HW05 Passport Local authentication', () => {
  test('unauthenticated requests cannot access protected routes', async () => {
    const me = await request(app).get('/auth/me')
    const protectedRoute = await request(app).get('/protected')
    expect(me.status).toBe(401)
    expect(protectedRoute.status).toBe(401)
  })

  test('registration validates email and password', async () => {
    const invalidEmail = await request(app).post('/auth/register')
      .send({ email: 'invalid-email', password: 'SafePass123!' })
    const shortPassword = await request(app).post('/auth/register')
      .send({ email: email(), password: 'short' })
    expect(invalidEmail.status).toBe(400)
    expect(shortPassword.status).toBe(400)
  })

  test('registration creates an authenticated session', async () => {
    const agent = request.agent(app)
    const userEmail = email()
    const response = await registerUser(agent, userEmail)
    expect(response.status).toBe(201)
    expect(response.body.user).toHaveProperty('id')
    expect(response.body.user.email).toBe(userEmail)
    expect(response.body.user).not.toHaveProperty('passwordHash')
    expect(response.headers['set-cookie']?.[0]).toContain('hw05.sid=')
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly')
    expect(response.headers['set-cookie']?.[0]).toContain('SameSite=Lax')
    const me = await agent.get('/auth/me')
    expect(me.status).toBe(200)
    expect(me.body.user.email).toBe(userEmail)
  })

  test('duplicate email is rejected regardless of letter case', async () => {
    const userEmail = email()
    await registerUser(request(app), userEmail)
    const response = await registerUser(request(app), userEmail.toUpperCase())
    expect(response.status).toBe(409)
  })

  test('passwords are stored as bcrypt hashes, not plaintext', async () => {
    const userEmail = email()
    await registerUser(request(app), userEmail)
    const account = accounts.get(userEmail)
    expect(account.passwordHash).not.toBe('SafePass123!')
    expect(account.passwordHash).toMatch(/^\$2[aby]\$/)
  })

  test('Passport Local rejects invalid credentials', async () => {
    const userEmail = email()
    await registerUser(request(app), userEmail)
    const response = await request(app).post('/auth/login')
      .send({ email: userEmail, password: 'WrongPass123!' })
    expect(response.status).toBe(401)
  })

  test('login accepts case-insensitive email and grants protected access', async () => {
    const userEmail = email()
    await registerUser(request(app), userEmail)
    const agent = request.agent(app)
    const login = await agent.post('/auth/login').send({
      email: userEmail.toUpperCase(), password: 'SafePass123!',
    })
    expect(login.status).toBe(200)
    expect(login.body.user.email).toBe(userEmail)
    const me = await agent.get('/auth/me')
    const protectedRoute = await agent.get('/protected')
    expect(me.status).toBe(200)
    expect(me.body.user.email).toBe(userEmail)
    expect(protectedRoute.status).toBe(200)
    expect(protectedRoute.body.user.email).toBe(userEmail)
  })

  test('logout destroys the authenticated session', async () => {
    const agent = request.agent(app)
    await registerUser(agent, email())
    const logout = await agent.post('/auth/logout')
    expect(logout.status).toBe(204)
    expect(logout.headers['set-cookie']?.[0]).toContain('hw05.sid=;')
    expect((await agent.get('/auth/me')).status).toBe(401)
    expect((await agent.get('/protected')).status).toBe(401)
  })

  test('DELETE /session does not destroy Passport authentication', async () => {
    const agent = request.agent(app)
    await registerUser(agent, email())
    await agent.get('/session')
    const reset = await agent.delete('/session')
    const me = await agent.get('/auth/me')
    expect(reset.status).toBe(204)
    expect(me.status).toBe(200)
  })

  test('login rejects missing credentials', async () => {
    const response = await request(app).post('/auth/login')
      .send({ email: '', password: '' })
    expect(response.status).toBe(400)
  })
})

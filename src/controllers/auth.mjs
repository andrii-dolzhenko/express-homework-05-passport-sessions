import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { accounts } from '../data/accounts.mjs'
import { SESSION_COOKIE_NAME } from '../middlewares/session.mjs'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getCredentials(body) {
  const { email, password } = body || {}
  if (typeof email !== 'string' || typeof password !== 'string') return null
  const normalizedEmail = email.trim().toLowerCase()
  if (
    normalizedEmail.length > 254 ||
    !EMAIL_PATTERN.test(normalizedEmail) ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) return null
  return { email: normalizedEmail, password }
}

export function toPublicUser(account) {
  return { id: account.id, email: account.email }
}

export async function register(req, res, next) {
  const credentials = getCredentials(req.body)
  if (!credentials) return res.status(400).json({ error: 'Invalid email or password' })
  const { email, password } = credentials
  if (accounts.has(email)) return res.status(409).json({ error: 'Email already exists' })

  const account = {
    id: randomUUID(),
    email,
    passwordHash: await bcrypt.hash(password, 10),
  }
  accounts.set(email, account)

  req.login(account, (error) => {
    if (error) {
      accounts.delete(email)
      return next(error)
    }
    return res.status(201).json({ user: toPublicUser(account) })
  })
}

export function me(req, res) {
  return res.status(200).json({ user: toPublicUser(req.user) })
}

export function logout(req, res, next) {
  req.logout((error) => {
    if (error) return next(error)
    req.session.destroy((destroyError) => {
      if (destroyError) return next(destroyError)
      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      })
      return res.status(204).end()
    })
  })
}

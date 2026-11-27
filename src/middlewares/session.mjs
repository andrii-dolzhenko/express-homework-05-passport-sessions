import { randomBytes } from 'node:crypto'
import session from 'express-session'

// MemoryStore is suitable for this coursework demo only, not production.
export const SESSION_COOKIE_NAME = 'hw05.sid'

export const sessionMiddleware = session({
  name: SESSION_COOKIE_NAME,
  secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000,
  },
})

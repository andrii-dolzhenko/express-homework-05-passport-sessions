import { Router } from 'express'
import passport from '../config/passport.mjs'
import { register, me, logout, toPublicUser } from '../controllers/auth.mjs'
import { requireAuth } from '../middlewares/requireAuth.mjs'

const router = Router()
router.post('/register', register)

router.post('/login', (req, res, next) => {
  const { email, password } = req.body || {}
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  passport.authenticate('local', (error, account) => {
    if (error) return next(error)
    if (!account) return res.status(401).json({ error: 'Invalid email or password' })
    req.login(account, (loginError) => {
      if (loginError) return next(loginError)
      return res.status(200).json({ user: toPublicUser(account) })
    })
  })(req, res, next)
})

router.get('/me', requireAuth, me)
router.post('/logout', logout)
export default router

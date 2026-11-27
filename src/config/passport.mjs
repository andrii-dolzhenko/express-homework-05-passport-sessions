import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import bcrypt from 'bcryptjs'
import { accounts } from '../data/accounts.mjs'

passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  async (email, password, done) => {
    try {
      const account = accounts.get(email.trim().toLowerCase())
      if (!account) return done(null, false)
      const valid = await bcrypt.compare(password, account.passwordHash)
      if (!valid) return done(null, false)
      return done(null, account)
    } catch (error) {
      return done(error)
    }
  }
))

passport.serializeUser((account, done) => done(null, account.id))
passport.deserializeUser((id, done) => {
  const account = Array.from(accounts.values()).find((item) => item.id === id)
  if (!account) return done(null, false)
  return done(null, account)
})

export default passport

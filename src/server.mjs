// Express REST API with modular routes and educational middleware.
import express from 'express'
import cookieParser from 'cookie-parser'
import { resolve } from 'node:path'
import { loadTheme } from './middlewares/theme.mjs'
import router from './routes/index.mjs'
import { logRequests } from './middlewares/logRequests.mjs'
import { sessionMiddleware } from './middlewares/session.mjs'
import passport from './config/passport.mjs'

const PORT = 3000
const app = express()
app.set('views', resolve(process.cwd(), 'src/views'))
app.set('view engine', 'pug')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(loadTheme)
app.use(logRequests)

// Session must run before Passport's session middleware.
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())

app.use('/assets', express.static(resolve(process.cwd(), 'src/public')))
app.use(express.static(resolve(process.cwd(), 'src/public'), { index: false }))
app.use(router)

app.use((req, res) => res.status(404).send('Not Found'))
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  if (err.status === 400 && err.type === 'entity.parse.failed') {
    return res.status(400).send('Bad Request')
  }
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`)
  return res.status(500).send('Internal Server Error')
})

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log(`\nRoutes:
  GET                 /
  GET, POST           /users, /articles
  GET, PUT, DELETE    /users/:userId, /articles/:articleId
  POST                /users/strict, /articles/strict
  GET, DELETE         /session
  GET                 /demo, /demo/icon
  GET, POST           /theme
  POST                /auth/register, /auth/login, /auth/logout
  GET                 /auth/me (Passport session)
  GET                 /protected (Passport-protected)
  GET                 /favicon.ico, /assets/...`)
})

export { server, app }

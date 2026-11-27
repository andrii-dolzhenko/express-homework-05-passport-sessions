import { Router } from 'express'

const router = Router()
router.get('/', (req, res) => {
  req.session.visits = (req.session.visits || 0) + 1
  return res.status(200).type('text/plain').send(`Visits: ${req.session.visits}`)
})

// Reset only the visits counter; keep Passport authentication in the session.
router.delete('/', (req, res) => {
  delete req.session.visits
  return res.status(204).end()
})
export default router

import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth.mjs'
import { toPublicUser } from '../controllers/auth.mjs'

const router = Router()
router.get('/', requireAuth, (req, res) => {
  return res.status(200).json({
    message: 'Protected route access granted',
    user: toPublicUser(req.user),
  })
})
export default router

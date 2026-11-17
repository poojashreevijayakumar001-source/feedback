import { Router } from 'express'
import Feedback from '../models/Feedback.js'
import { verifyLogin, adminOnly } from '../middleware/verifyLogin.js'

const router = Router()
router.use(verifyLogin)

router.post('/', async (req, res) => {
  try {
    const { category, rating, message } = req.body
    if (!message || !rating) return res.status(400).json({ message: 'Rating and message are required' })
    res.status(201).json(await Feedback.create({ user: req.user.id, category, rating, message }))
  } catch (e) { res.status(400).json({ message: e.message }) }
})

router.get('/my', async (req, res) => res.json(await Feedback.find({ user: req.user.id }).sort({ createdAt: -1 })))

// Admin: summary numbers (must be above '/:id')
router.get('/stats', adminOnly, async (_req, res) => {
  const all = await Feedback.find()
  const total = all.length
  const average = total ? (all.reduce((s, f) => s + f.rating, 0) / total).toFixed(1) : '0.0'
  res.json({ total, average, new: all.filter((f) => f.status === 'New').length, resolved: all.filter((f) => f.status === 'Resolved').length })
})

router.get('/', adminOnly, async (req, res) => {
  const q = req.query.category ? { category: req.query.category } : {}
  res.json(await Feedback.find(q).populate('user', 'name email').sort({ createdAt: -1 }))
})

router.patch('/:id', adminOnly, async (req, res) => {
  const { status, reply } = req.body
  if (status && !['New', 'Reviewed', 'Resolved'].includes(status)) return res.status(400).json({ message: 'Invalid status' })
  const update = {}
  if (status) update.status = status
  if (reply !== undefined) { update.reply = reply; if (!status) update.status = 'Reviewed' }
  const fb = await Feedback.findByIdAndUpdate(req.params.id, update, { new: true })
  if (!fb) return res.status(404).json({ message: 'Feedback not found' })
  res.json(fb)
})

export default router

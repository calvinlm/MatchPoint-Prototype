import { Router } from 'express'
import crypto from 'crypto'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Returns a signed payload so the client can upload directly to Cloudinary.
// Client will POST to https://api.cloudinary.com/v1_1/<cloud_name>/auto/upload
// with fields: file, api_key, timestamp, folder, signature
router.get('/signature', requireAuth, async (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'match-control'

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary env vars missing' })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  // Build signature string according to Cloudinary rules
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  const signature = crypto.createHash('sha1').update(toSign).digest('hex')

  res.json({
    cloudName,
    apiKey,
    timestamp,
    folder,
    signature
  })
})

export default router
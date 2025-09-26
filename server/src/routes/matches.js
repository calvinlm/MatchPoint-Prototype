import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabaseForToken } from '../config/supabase.js'

const router = Router()

// Example table: "matches"
// Suggested columns: id (uuid), owner_id (uuid), title (text), status (text), created_at (timestamptz), updated_at (timestamptz)
// Ensure RLS is enabled with policies that restrict to owner_id = auth.uid()

router.get('/', requireAuth, async (req, res) => {
  const sb = supabaseForToken(req.accessToken)
  const { data, error } = await sb.from('matches').select('*').order('created_at', { ascending: false })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ data })
})

router.post('/', requireAuth, async (req, res) => {
  const sb = supabaseForToken(req.accessToken)
  const payload = {
    title: req.body?.title ?? 'Untitled',
    status: req.body?.status ?? 'draft',
    // owner_id: will be set via DB default or trigger to auth.uid()
  }
  const { data, error } = await sb.from('matches').insert(payload).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json({ data })
})

router.get('/:id', requireAuth, async (req, res) => {
  const sb = supabaseForToken(req.accessToken)
  const { data, error } = await sb.from('matches').select('*').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: error.message })
  res.json({ data })
})

router.put('/:id', requireAuth, async (req, res) => {
  const sb = supabaseForToken(req.accessToken)
  const updates = {
    title: req.body?.title,
    status: req.body?.status
  }
  const { data, error } = await sb.from('matches').update(updates).eq('id', req.params.id).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.json({ data })
})

router.delete('/:id', requireAuth, async (req, res) => {
  const sb = supabaseForToken(req.accessToken)
  const { error } = await sb.from('matches').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.status(204).send()
})

export default router
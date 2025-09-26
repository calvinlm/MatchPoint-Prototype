import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Verifies Supabase JWT from "Authorization: Bearer <token>"
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token' })
    }

    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    // attach basic user info
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role || 'user',
      app_metadata: data.user.app_metadata,
      user_metadata: data.user.user_metadata
    }
    req.accessToken = token
    return next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    return res.status(500).json({ error: 'Auth check failed' })
  }
}
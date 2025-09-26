import cors from 'cors'

export function corsWithOrigins() {
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
  return cors({
    origin: function(origin, callback) {
      if (!origin) return callback(null, true) // allow non-browser tools
      if (allowed.includes(origin)) return callback(null, true)
      return callback(new Error('Not allowed by CORS: ' + origin))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
}
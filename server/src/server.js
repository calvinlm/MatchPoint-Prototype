import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'

// ---------- CORS (single source of truth) ----------
const ORIGIN_WHITELIST = [
  'http://localhost:3000',
  'https://match-point-prototype.vercel.app',
  // allow Vercel preview URLs for this project
  /^https:\/\/match-point-prototype-[a-z0-9-]+\.vercel\.app$/,
]

function isAllowedOrigin(origin) {
  if (!origin) return true // server-to-server, curl, health checks
  return ORIGIN_WHITELIST.some((o) =>
    typeof o === 'string' ? o === origin : o.test(origin)
  )
}

const corsOptions = {
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true)
    return cb(new Error(`CORS blocked for origin: ${origin}`))
  },
  credentials: true, // keep true only if you use cookies/sessions
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

// ---------- Routers ----------
import healthRouter from './routes/health.js'
import meRouter from './routes/me.js'
import matchesRouter from './routes/matches.js'
import uploadRouter from './routes/upload.js'
import authRoutes from './routes/auth.js'
import matchRoutes from './routes/match.js'
import playersRoutes from './routes/players.js'

const app = express()

// ---------- Security & middleware ----------
app.use(helmet())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// CORS must be BEFORE any routes
app.use(cors(corsOptions))
// handle preflight on all routes
app.options('*', cors(corsOptions))

// ---------- Routes ----------
app.get('/', (_req, res) => res.status(200).send('✅ MatchPoint API is running'))
app.get('/health', (_req, res) => res.status(200).send('ok'))
app.use('/health', healthRouter)
app.use('/api/me', meRouter)
app.use('/api/matches', matchesRouter)
app.use('/api/upload', uploadRouter)
app.use('/auth', authRoutes)
app.use('/matches', matchRoutes)
app.use('/api/players', playersRoutes)

// 404 handler (keep last)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// ---------- Server / Socket.IO ----------
const port = Number(process.env.PORT) || 8080
const host = '0.0.0.0'
const server = http.createServer(app)

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) return cb(null, true)
      return cb(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
})

io.on('connection', (socket) => {
  console.log('socket connected', socket.id)

  socket.on('join_match', (matchId) => socket.join(`match:${matchId}`))
  socket.on('leave_match', (matchId) => socket.leave(`match:${matchId}`))
  socket.on('score_update', ({ matchId, payload }) => {
    io.to(`match:${matchId}`).emit('score_update', payload)
  })
  socket.on('disconnect', () => console.log('socket disconnected', socket.id))
})

server.listen(port, host, () => {
  console.log(`✅ API listening on http://${host}:${port}`)
})

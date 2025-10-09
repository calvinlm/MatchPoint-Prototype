import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'

// Routers
import healthRouter from './routes/health.js'
import meRouter from './routes/me.js'
import matchesRouter from './routes/matches.js'
import uploadRouter from './routes/upload.js'
import authRoutes from "./routes/auth.js"
import matchRoutes from "./routes/match.js"
import playersRoutes from "./routes/players.js"

const app = express()

// ✅ CORS setup
const allowedOrigins = [
  "https://match-point-prototype.vercel.app",
  "http://localhost:3000", // for local testing
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
    } else {
      callback(null, true)
      callback(new Error(`CORS blocked for origin: ${origin}`))
    }
  },
  credentials: true,
}))

// ✅ Security & middleware
app.use(helmet())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// ✅ Routes
app.use('/health', healthRouter)
app.use('/api/me', meRouter)
app.use('/api/matches', matchesRouter)
app.use('/api/upload', uploadRouter)
app.use("/auth", authRoutes)
app.use("/matches", matchRoutes)
app.use("/api/players", playersRoutes)

// ✅ 404 handler (properly scoped)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// ✅ Server setup
const port = process.env.PORT || 8080
const server = http.createServer(app)

// ✅ Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  console.log('socket connected', socket.id)

  socket.on('join_match', (matchId) => {
    socket.join(`match:${matchId}`)
  })

  socket.on('leave_match', (matchId) => {
    socket.leave(`match:${matchId}`)
  })

  socket.on('score_update', ({ matchId, payload }) => {
    io.to(`match:${matchId}`).emit('score_update', payload)
  })

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id)
  })
})

// ✅ Render requires 0.0.0.0 binding
server.listen(port, '0.0.0.0', () => {
  console.log(`✅ API listening on port ${port}`)
})

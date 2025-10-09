import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { corsWithOrigins } from './utils/cors.js'


import healthRouter from './routes/health.js'
import meRouter from './routes/me.js'
import matchesRouter from './routes/matches.js'
import uploadRouter from './routes/upload.js'
import authRoutes from "./routes/auth.js";
import matchRoutes from "./routes/match.js";
import playersRoutes from "./routes/players.js";

const app = express()

app.use(helmet())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use(corsWithOrigins())

// Routes
app.use('/health', healthRouter)
app.use('/api/me', meRouter)
app.use('/api/matches', matchesRouter)
app.use('/api/upload', uploadRouter)
app.use("/auth", authRoutes);
app.use("/matches", matchRoutes);
app.use("/api/players", playersRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

const port = process.env.PORT || 8080
const server = http.createServer(app)

// Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  console.log('socket connected', socket.id)

  // Example rooms per match id
  socket.on('join_match', (matchId) => {
    socket.join(`match:${matchId}`)
  })

  socket.on('leave_match', (matchId) => {
    socket.leave(`match:${matchId}`)
  })

  // Broadcast example: score update
  socket.on('score_update', ({ matchId, payload }) => {
    io.to(`match:${matchId}`).emit('score_update', payload)
  })

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id)
  })
})

server.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
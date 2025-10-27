import dotenv from 'dotenv'
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` })

import http from 'http'
import path from 'path'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'

import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { reviewRoutes } from './api/review/review.routes.js'
import { stayRoutes } from './api/stay/stay.routes.js'
import { reservationRoutes } from './api/reservation/reservation.routes.js'
import { setupSocketAPI } from './services/socket.service.js'
import { setupAsyncLocalStorage } from './middlewares/setupAls.middleware.js'
import { logger } from './services/logger.service.js'

process.env.DEBUG = 'router:*,express:*'

const __dirname = path.resolve()

// Allowed CORS origins (dev + prod)
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://skystay.onrender.com',
]

const app = express()
const server = http.createServer(app)

// Middleware
app.use(cookieParser())
app.use(express.json())

// CORS (enabled for both dev & prod)
app.use(
    cors({
        origin(origin, cb) {
            if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
            console.warn(' Blocked by CORS:', origin)
            return cb(new Error('Not allowed by CORS'))
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
)

// Handle OPTIONS preflights globally
app.options(/.*/, (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.sendStatus(204)
})

// ALS (must come before routes)
app.use(setupAsyncLocalStorage)

// API Routes 
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/stay', stayRoutes)
app.use('/api/reservation', reservationRoutes)

// Socket.io Setup
// not relebant right now
//setupSocketAPI(server)

// Serve Frontend in Production 
if (process.env.NODE_ENV === 'production') {
    console.log('Production mode — serving frontend from /public')
    app.use(express.static(path.join(__dirname, 'public')))

    // Express 5
    app.use((req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'))
    })
}

// Start Server
const port = process.env.PORT || 3030
server.listen(port, () => logger.info(`Server running on port: ${port}`))

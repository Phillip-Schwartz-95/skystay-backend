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

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://skystay.onrender.com',
]

const app = express()
const server = http.createServer(app)

app.use(cookieParser())
app.use(express.json())

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        } else {
            console.warn('Blocked by CORS:', origin)
            return callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
}))

app.use(setupAsyncLocalStorage)

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/stay', stayRoutes)
app.use('/api/reservation', reservationRoutes)

// setupSocketAPI(server)

if (process.env.NODE_ENV === 'production') {
    console.log('Production mode — serving frontend from /public')
    app.use(express.static(path.join(__dirname, 'public')))

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'))
    })
}

const port = process.env.PORT || 3030
server.listen(port, () => logger.info(`Server running on port: ${port}`))

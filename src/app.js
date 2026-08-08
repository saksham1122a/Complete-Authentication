import express from 'express'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import authRouter from '../src/routes/auth.routes.js'

const app = express()

app.use(express.json())
app.use(morgan("dev"));   // morgan is a logger generally tells about the request detials made to the server like method, on which api does it hit and how much response time did it took.
app.use(cookieParser())
app.use("/api/auth", authRouter)

export default app
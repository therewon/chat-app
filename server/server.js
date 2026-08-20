import express from 'express'
import "dotenv/config"
import cors from "cors"
import http from 'http'
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from './models/User.js'

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        callback(new Error("Origin is not allowed by CORS"))
    }
}

// Create Express app and HTTP Server
const app = express();
const server = http.createServer(app)

// Initialize socket.io server
export const io = new Server(server, {
    cors: {origin: allowedOrigins}
})

// Store online users
export const userSocketMap = Object.create(null) // { userId: Set<socketId> }

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token
        if (!token) return next(new Error("Authentication required"))

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded?.userId) return next(new Error("Invalid token"))

        const userExists = await User.exists({_id: decoded.userId})
        if (!userExists) return next(new Error("User not found"))

        socket.userId = decoded.userId
        next()
    } catch {
        next(new Error("Invalid or expired token"))
    }
})

// Socket.io connection handler
io.on("connection", (socket)=> {
    const userId = socket.userId
    console.log("User Connected", userId)

    if(!userSocketMap[userId]) userSocketMap[userId] = new Set()
    userSocketMap[userId].add(socket.id)

    // Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    socket.on("disconnect", ()=>{
        console.log("User Disconnected", userId)
        userSocketMap[userId]?.delete(socket.id)
        if (userSocketMap[userId]?.size === 0) delete userSocketMap[userId]
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

// Middleware setup 
app.use(express.json({limit: "6mb"}))
app.use(cors(corsOptions))

// Router setup
app.use("/api/status", (req,res)=> res.send("Server is live"))
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)

// Connect to MongoDb
await connectDB()

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log("Server is running on PORT: " + PORT))

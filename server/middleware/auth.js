import User from "../models/User.js"
import jwt from 'jsonwebtoken'


// Middleware to protect routes
export const protectRoute = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization
        const bearerToken = authorization?.startsWith("Bearer ")
            ? authorization.slice(7)
            : null
        const token = bearerToken || req.headers.token

        if (!token) {
            return res.status(401).json({success: false, message: "Authentication required"})
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.userId).select("-password")

        if(!user) {
            return res.status(401).json({success: false, message: "User not found"})
        }

        req.user = user;
        next()
    } catch (error) {
        const isAuthError = ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)
        const status = isAuthError ? 401 : 500
        const message = isAuthError ? "Invalid or expired token" : "Authentication failed"
        console.error(error.message)
        res.status(status).json({success: false, message})
    }
}

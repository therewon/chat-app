import { createContext, useState } from "react";
import axios from 'axios'
import toast from "react-hot-toast";

const backendUrl = import.meta.env.VITE_BACKEND_URL
axios.defaults.baseUrl = backendUrl

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"))
    const [authUser, setAuthUser] = useState(null)
    const [onlineUsers, setOnlineUsers] = useState([])
    const [socket, setSocket] = useState(null)

    // Check if user is authenticated and if so, set the user data and connect the socket
    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check")
            if( data.success ){
                setAuthUser(data.user)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }


    const values = {
        axios,
        authUser,
        onlineUsers,
        socket
    }

    return (
        <AuthProvider value={value}>
            {children}
        </AuthProvider>
    )
}
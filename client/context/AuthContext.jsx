import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client"
import { AuthContext } from "./AuthContext.js"

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const api = axios.create({baseURL: backendUrl})

api.interceptors.request.use((config) => {
  const storedToken = localStorage.getItem("token")
  if (storedToken) config.headers.Authorization = `Bearer ${storedToken}`
  return config
})

const getErrorMessage = (error, fallback) => error.response?.data?.message || error.message || fallback

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => Boolean(localStorage.getItem("token")));
  const socketRef = useRef(null)

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setSocket(null)
    setOnlineUsers([])
  }, [])

  const connectSocket = useCallback((userData, authToken) => {
    if (!userData || !authToken || socketRef.current?.connected) return

    if (socketRef.current) socketRef.current.disconnect()

    const newSocket = io(backendUrl, {
      auth: {token: authToken},
      autoConnect: false
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    newSocket.on("getOnlineUsers", setOnlineUsers)
    newSocket.on("connect_error", (error) => {
      toast.error(error.message || "Realtime connection failed")
    })
    newSocket.connect()
  }, [])

  const clearAuth = useCallback(() => {
    localStorage.removeItem("token")
    setToken(null)
    setAuthUser(null)
    disconnectSocket()
  }, [disconnectSocket])

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (!storedToken) return undefined

    let isMounted = true

    const verifyAuth = async () => {
      try {
        const {data} = await api.get("/api/auth/check")
        if (!isMounted) return

        if (data.success) {
          setAuthUser(data.user)
          connectSocket(data.user, storedToken)
        } else {
          clearAuth()
        }
      } catch (error) {
        if (!isMounted) return
        clearAuth()
        if (error.response?.status !== 401) {
          toast.error(getErrorMessage(error, "Could not verify session"))
        }
      } finally {
        if (isMounted) setIsCheckingAuth(false)
      }
    }

    verifyAuth()

    return () => {
      isMounted = false
    }
  }, [clearAuth, connectSocket])

  useEffect(() => () => {
    if (socketRef.current) socketRef.current.disconnect()
  }, [])

  // Login function to handle user authentication and socket connection

  const login = async (state, credentials) => {
    try {
      const { data } = await api.post(`/api/auth/${state}`, credentials)
      if(data.success) {
        localStorage.setItem("token", data.token)
        setAuthUser(data.userData)
        setToken(data.token)
        connectSocket(data.userData, data.token)
        toast.success(data.message)
        return true
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Authentication failed"))
    }
    return false
  }

  // Logout function to handle user logout and socket disconnection

  const logout = () => {
    clearAuth()
    toast.success("Logged out successfully")
  }

  // Update profile function to handle user profile updates 

  const updateProfile = async (body)=> {
    try {
      const { data } = await api.put("/api/auth/update-profile",body)
      if(data.success) {
        setAuthUser(data.user)
        toast.success("Profile updated successfully")
        return true
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update profile"))
    }
    return false
  }

  const values = {
    axios: api,
    token,
    authUser,
    onlineUsers,
    socket,
    isCheckingAuth,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={values}>
      {children}
    </AuthContext.Provider>
  );
};

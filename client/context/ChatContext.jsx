import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import { ChatContext } from "./ChatContext.js";
import toast from "react-hot-toast";

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([])
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [unseenMessages, setUnseenMessages] = useState({})

    const { socket, axios } = useContext(AuthContext)

    // function to get all users for sidebar
    const getUsers = useCallback(async () => {
        try {
            const { data } = await axios.get("/api/messages/users")
            if (data.success) {
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }, [axios])

    // function to get messages for selected user
    const getMessages = useCallback(async (userId) => {
        if (!userId) return
        setMessages([])

        try {
            const { data } = await axios.get(`/api/messages/${userId}`)
            if (data.success) {
                setMessages(data.messages)
                setUnseenMessages((previous) => {
                    const next = {...previous}
                    delete next[userId]
                    return next
                })
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }, [axios])

    // function to send message to selected user 
    const sendMessages = useCallback(async (messageData) => {
        if (!selectedUser) return false

        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData)
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.newMessage])
                return true
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
        return false
    }, [axios, selectedUser])

    const selectUser = useCallback((user) => {
        setSelectedUser(user)
        if (user) {
            setUnseenMessages((previous) => {
                const next = {...previous}
                delete next[user._id]
                return next
            })
        }
    }, [])

    // Subscribe to new messages and clean up the exact listener on changes.
    useEffect(() => {
        if (!socket) return undefined

        const handleNewMessage = (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                setMessages((prevMessages) => [...prevMessages, {...newMessage, seen: true}])
                axios.put(`/api/messages/mark/${newMessage._id}`).catch((error) => {
                    toast.error(error.response?.data?.message || error.message)
                })
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages, [newMessage.senderId]:
                        prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1
                }))
            }
        }

        socket.on("newMessage", handleNewMessage)
        return () => socket.off("newMessage", handleNewMessage)
    }, [axios, socket, selectedUser])

    const value = useMemo(() => ({
        messages, users, selectedUser, getUsers, getMessages, sendMessages,
        setSelectedUser, selectUser, unseenMessages
    }), [messages, users, selectedUser, getUsers, getMessages, sendMessages, selectUser, unseenMessages])

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )

}

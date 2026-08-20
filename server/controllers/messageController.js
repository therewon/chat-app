import Message from '../models/Message.js'
import User from '../models/User.js'
import cloudinary from '../lib/cloudinary.js'
import { io, userSocketMap } from '../server.js'
import mongoose from 'mongoose'

// Get all users except the logged in user
export const getUsersForSidebar = async (req, res)=> {
    try {
        const userId = req.user._id
        const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password")

        // Count number of messages not seen
        const unseenMessages = {}
        const promises = filteredUsers.map(async (user) => {
            const unseenCount = await Message.countDocuments({senderId: user._id, recieverId: userId, seen: false})
            if(unseenCount > 0){
                unseenMessages[user._id] = unseenCount
            }
        })
        await Promise.all(promises)
        res.json({success: true , users: filteredUsers, unseenMessages})
    } catch (error) {
        console.error(error.message)
        res.status(500).json({success: false, message: "Could not load users"})
    }
}

// Get all messages for selected user
export const getMessages = async ( req , res) => {
    try {
        const { id: selectedUserId } = req.params
        const myId = req.user._id

        if (!mongoose.isValidObjectId(selectedUserId)) {
            return res.status(400).json({success: false, message: "Invalid user id"})
        }

        const selectedUserExists = await User.exists({_id: selectedUserId})
        if (!selectedUserExists) {
            return res.status(404).json({success: false, message: "User not found"})
        }

        const messages = await Message.find({
            $or: [
                {senderId: myId, recieverId: selectedUserId},
                {senderId: selectedUserId, recieverId: myId}
            ]
        }).sort({createdAt: 1})
        await Message.updateMany({senderId: selectedUserId, recieverId: myId}, {seen: true})

        res.json({success: true, messages})
    } catch (error) {
        console.error(error.message)
        res.status(500).json({success: false, message: "Could not load messages"})
    }
}

// api to mark message as seen using message id
export const markMessageAsSeen = async(req,res)=> {
    try {
        const { id } = req.params

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({success: false, message: "Invalid message id"})
        }

        const updatedMessage = await Message.findOneAndUpdate(
            {_id: id, recieverId: req.user._id},
            {seen: true},
            {returnDocument: "after"}
        )

        if (!updatedMessage) {
            return res.status(404).json({success: false, message: "Message not found"})
        }

        res.json({success: true})
    } catch (error) {
        console.error(error.message)
        res.status(500).json({success: false, message: "Could not mark message as seen"})
    }
}

// send message to selected user
export const sendMessages = async (req, res) => {
    try {
        const { text, image } = req.body
        const recieverId = req.params.id
        const senderId = req.user._id
        const cleanText = typeof text === "string" ? text.trim() : ""

        if (!mongoose.isValidObjectId(recieverId)) {
            return res.status(400).json({success: false, message: "Invalid recipient id"})
        }

        if (senderId.toString() === recieverId) {
            return res.status(400).json({success: false, message: "You cannot message yourself"})
        }

        if (!cleanText && !image) {
            return res.status(400).json({success: false, message: "Message cannot be empty"})
        }

        if (cleanText.length > 5000) {
            return res.status(400).json({success: false, message: "Message is too long"})
        }

        const recipientExists = await User.exists({_id: recieverId})
        if (!recipientExists) {
            return res.status(404).json({success: false, message: "Recipient not found"})
        }

        let imageUrl;
        if(image){
            if (typeof image !== "string" || !/^data:image\/(png|jpeg|webp);base64,/.test(image)) {
                return res.status(400).json({success: false, message: "Invalid image"})
            }

            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "quick-chat/messages",
                resource_type: "image"
            })
            imageUrl = uploadResponse.secure_url
        }
        const newMessage = await Message.create({
            senderId,
            recieverId,
            text: cleanText || undefined,
            image: imageUrl
        })

        // Emit the new messages to the reciever's socket
        const recieverSocketIds = userSocketMap[recieverId]
        if(recieverSocketIds){
            for (const socketId of recieverSocketIds) {
                io.to(socketId).emit("newMessage", newMessage)
            }
        }

        res.status(201).json({success: true, newMessage})
    } catch (error) {
        console.error(error.message)
        res.status(500).json({success: false, message: "Could not send message"})
    }
}

import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";

const getPublicUser = (user) => {
    const publicUser = user.toObject ? user.toObject() : {...user}
    delete publicUser.password
    return publicUser
}

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0

// Signup a new user
export const signup = async (req , res) => {
    const {fullName, email, password, bio} = req.body;


    try {
        if(!isNonEmptyString(fullName) || !isNonEmptyString(email) || !isNonEmptyString(password) || !isNonEmptyString(bio)){
            return res.status(400).json({success: false, message: "All fields are required"})
        }

        if (password.length < 6) {
            return res.status(400).json({success: false, message: "Password must be at least 6 characters"})
        }

        const normalizedEmail = email.trim().toLowerCase()
        const user = await User.findOne({email: normalizedEmail})

        if(user){
            return res.status(409).json({success: false , message: "Account already exists"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = await User.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            bio: bio.trim()
        })

        const token = generateToken(newUser._id)

        res.status(201).json({
            success: true,
            userData: getPublicUser(newUser),
            token,
            message: "Account created successfully"
        })
    } catch (error) {
        console.error(error.message)
        const status = error.code === 11000 ? 409 : 500
        const message = error.code === 11000 ? "Account already exists" : "Could not create account"
        res.status(status).json({success: false, message})
    }
}


// Controller to login a user
export const login = async (req, res) => {
    try {
        const {email, password} = req.body

        if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
            return res.status(400).json({success: false, message: "Email and password are required"})
        }

        const userData = await User.findOne({email: email.trim().toLowerCase()}).select("+password")

        if (!userData) {
            return res.status(401).json({success: false, message: "Invalid credentials"})
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password)

        if(!isPasswordCorrect) {
            return res.status(401).json({success: false, message: "Invalid credentials"})
        }

        const token = generateToken(userData._id)

        res.json({
            success: true,
            userData: getPublicUser(userData),
            token,
            message: 'Login successful'
        })
    } catch (error) {
        console.error(error.message)
        res.status(500).json({success: false, message: "Could not log in"})
    }
}

// Controller to check if user is authenticated
export const checkAuth = (req,res) => {
    res.json({success: true, user: req.user})
}

// Controller to update user profile details
export const updateProfile = async (req,res) => {
    try {
        const {profilePic, bio, fullName} = req.body

        if (!isNonEmptyString(fullName) || !isNonEmptyString(bio)) {
            return res.status(400).json({success: false, message: "Name and bio are required"})
        }

        if (profilePic && (typeof profilePic !== "string" || !/^data:image\/(png|jpeg|webp);base64,/.test(profilePic))) {
            return res.status(400).json({success: false, message: "Invalid profile image"})
        }

        const userId = req.user._id
        const updates = {bio: bio.trim(), fullName: fullName.trim()}

        if(profilePic) {
            const upload = await cloudinary.uploader.upload(profilePic, {
                folder: "quick-chat/profiles",
                resource_type: "image"
            })
            updates.profilePic = upload.secure_url
        }

        const updateUser = await User.findByIdAndUpdate(userId, updates, {returnDocument: "after"})
        res.json({success: true, user: getPublicUser(updateUser)})
    } catch (error) {
        console.error(error.message)
        res.status(500).json({success: false, message: "Could not update profile"})
    }
}

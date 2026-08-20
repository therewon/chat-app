import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true, lowercase: true, trim: true},
    fullName: {type: String, required: true, trim: true},
    password: {type: String, required: true, minlength: 6, select: false},
    profilePic: {type: String, default: ""},
    bio: {type: String, default: "", trim: true},
}, {timestamps: true})

userSchema.set("toJSON", {
    transform: (_document, returnedObject) => {
        delete returnedObject.password
        return returnedObject
    }
})

 const User = mongoose.model("User", userSchema)

 export default User

import mongoose from "mongoose";

// Function to connect to the mongodb database
export const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not configured")
    }

    await mongoose.connect(process.env.MONGODB_URI, {dbName: "quick-chat"})
    console.log("Database Connected")
}

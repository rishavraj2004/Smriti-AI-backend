import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config()

const DB = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(DB);
        console.log("DB CONNECTED")
    } catch (error) {
        console.log("DB CONNECTION FAILED", error.message);
        process.exit(1);
    }
};


export default connectDB;
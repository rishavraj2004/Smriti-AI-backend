import dotenv from "dotenv"
import app from "./app.js";
import connectDB from "./config/db.js";
dotenv.config();


await connectDB()

const port = process.env.PORT || 4000;



const server = app.listen(port, () => {
    console.log(`App is running on Port ${port}`);
})
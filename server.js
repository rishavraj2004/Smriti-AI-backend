import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

await connectDB();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App is running on Port ${port}`);
});

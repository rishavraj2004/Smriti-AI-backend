import express from "express";
import globalErrorhandler from "./controller/errorController.js"
import AppError from "./utils/appError.js";

const app = express();

app.use(express.json({ limit: '10kb' }));

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        time: new Date()
    });
});

app.use(globalErrorhandler);

export default app;
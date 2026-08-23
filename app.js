import express from "express";
import cors from "cors";
import globalErrorhandler from "./controller/errorController.js";
import AppError from "./utils/appError.js";
import patientAuthRouter from "./routes/patientAuthRoutes.js";
import caregiverRouter from "./routes/caregiverRoutes.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(express.json({ limit: "10kb" }));

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "ok",
        time: new Date().toISOString()
    });
});

app.use("/api/auth", patientAuthRouter);
app.use("/api", caregiverRouter);

app.all("/{*splat}", (req, res, next) => {
    next(new AppError(`Route ${req.method} ${req.originalUrl} was not found`, 404));
});

app.use(globalErrorhandler);

export default app;

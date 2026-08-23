import express from "express";
import rateLimit from "express-rate-limit";
import { requireAnyAuth } from "../middleware/authMiddleware.js";
import {
  sendChatMessage,
  getChatHistory,
  clearChatHistory,
} from "../controller/chatController.js";

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests to Mitr AI. Please slow down and wait a moment.",
  },
});

router.post("/", chatLimiter, requireAnyAuth, sendChatMessage);
router.get("/history", requireAnyAuth, getChatHistory);
router.delete("/history", requireAnyAuth, clearChatHistory);

export default router;

import express from "express";
import {
  getNextGame,
  submitGameSession,
  getGameHistory,
} from "../controller/gameController.js";
import { requirePatientAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/next", requirePatientAuth, getNextGame);
router.post("/session", requirePatientAuth, submitGameSession);
router.get("/history", requirePatientAuth, getGameHistory);

export default router;

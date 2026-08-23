import express from "express";
import { getCurrentPatient, loginPatient, signupPatient } from "../controller/patientAuthController.js";
import { requirePatientAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/patient/signup", signupPatient);
router.post("/patient/login", loginPatient);
router.get("/me", requirePatientAuth, getCurrentPatient);

export default router;

import express from "express";
import {
  getDashboard,
  linkPatient,
  loginCaregiver,
  signupCaregiver,
  getPatientSessions,
  getPatientPerformance,
} from "../controller/caregiverController.js";
import { requireCaregiverAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/auth/caregiver/signup", signupCaregiver);
router.post("/auth/caregiver/login", loginCaregiver);
router.post("/caregiver/link-patient", requireCaregiverAuth, linkPatient);
router.get("/caregiver/dashboard", requireCaregiverAuth, getDashboard);
router.get("/caregiver/patient/sessions", requireCaregiverAuth, getPatientSessions);
router.get("/caregiver/patient/performance", requireCaregiverAuth, getPatientPerformance);

export default router;

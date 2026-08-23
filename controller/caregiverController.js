import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Caregiver from "../models/Caregiver.js";
import Patient from "../models/Patient.js";
import AppError from "../utils/appError.js";
import generateToken from "../utils/generateToken.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const safeCaregiver = (caregiver) => ({
  id: caregiver._id.toString(),
  name: caregiver.name,
  email: caregiver.email,
});

const safePatient = (patient) => ({
  id: patient._id.toString(),
  name: patient.name,
  email: patient.email,
  age: patient.age,
  language: patient.language,
  region: patient.region,
  pairingCode: patient.pairingCode,
});

export const signupCaregiver = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (typeof name !== "string" || !name.trim() || !EMAIL_PATTERN.test(normalizedEmail) || typeof password !== "string" || password.length < 8) {
      return next(new AppError("Provide a valid name, email, and password (minimum 8 characters)", 400));
    }
    if (await Caregiver.exists({ email: normalizedEmail })) return next(new AppError("An account with this email already exists", 409));

    const caregiver = await Caregiver.create({
      name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12),
    });
    res.status(201).json({
      success: true,
      message: "Caregiver account created successfully",
      token: generateToken(caregiver._id, "caregiver"),
      caregiver: safeCaregiver(caregiver),
    });
  } catch (error) { next(error); }
};

export const loginCaregiver = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!EMAIL_PATTERN.test(normalizedEmail) || typeof password !== "string") return next(new AppError("Provide a valid email and password", 400));

    const caregiver = await Caregiver.findOne({ email: normalizedEmail }).select("+passwordHash");
    if (!caregiver || !(await bcrypt.compare(password, caregiver.passwordHash))) return next(new AppError("Email or password is incorrect", 401));
    res.json({ success: true, message: "Login successful", token: generateToken(caregiver._id, "caregiver"), caregiver: safeCaregiver(caregiver) });
  } catch (error) { next(error); }
};

export const linkPatient = async (req, res, next) => {
  try {
    const pairingCode = typeof req.body?.pairingCode === "string" ? req.body.pairingCode.trim().toUpperCase() : "";
    if (!/^SMR-[A-Z0-9]{4}$/.test(pairingCode)) return next(new AppError("Provide a valid pairing code", 400));
    if (!mongoose.isObjectIdOrHexString(req.caregiverId)) return next(new AppError("Invalid authentication token", 401));

    const patient = await Patient.findOne({ pairingCode });
    if (!patient) return next(new AppError("No patient was found with this pairing code", 404));
    if (patient.caregiverId && patient.caregiverId.toString() !== req.caregiverId) {
      return next(new AppError("This patient is already linked to another caregiver", 409));
    }

    patient.caregiverId = req.caregiverId;
    await patient.save();
    res.json({ success: true, message: "Patient linked successfully", patient: safePatient(patient) });
  } catch (error) { next(error); }
};

export const getDashboard = async (req, res, next) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.caregiverId)) return next(new AppError("Invalid authentication token", 401));
    const patient = await Patient.findOne({ caregiverId: req.caregiverId });
    if (!patient) return next(new AppError("No patient is linked to this caregiver yet", 404));
    res.json({ success: true, patient: safePatient(patient) });
  } catch (error) { next(error); }
};

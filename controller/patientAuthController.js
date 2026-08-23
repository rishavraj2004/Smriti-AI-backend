import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Patient, { SUPPORTED_LANGUAGES } from "../models/Patient.js";
import AppError from "../utils/appError.js";
import generatePairingCode from "../utils/generatePairingCode.js";
import generateToken from "../utils/generateToken.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const safePatient = (patient) => ({
  id: patient._id.toString(),
  name: patient.name,
  email: patient.email,
  age: patient.age,
  language: patient.language,
  region: patient.region,
  pairingCode: patient.pairingCode,
});

export const signupPatient = async (req, res, next) => {
  try {
    const { name, email, password, age, language, region } = req.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const numericAge = typeof age === "number" ? age : Number(age);
    const valid = typeof name === "string" && name.trim() && EMAIL_PATTERN.test(normalizedEmail) &&
      typeof password === "string" && password.length >= 8 && Number.isInteger(numericAge) &&
      numericAge >= 1 && numericAge <= 120 && SUPPORTED_LANGUAGES.includes(language) &&
      typeof region === "string" && region.trim();
    if (!valid) return next(new AppError("Provide a valid name, email, password (minimum 8 characters), age, language, and region", 400));

    if (await Patient.exists({ email: normalizedEmail })) {
      return next(new AppError("An account with this email already exists", 409));
    }

    const patient = await Patient.create({
      name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12),
      age: numericAge, language, region: region.trim(), pairingCode: await generatePairingCode(),
    });
    res.status(201).json({
      success: true,
      message: "Patient account created successfully",
      token: generateToken(patient._id),
      patient: safePatient(patient),
    });
  } catch (error) { next(error); }
};

export const loginPatient = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!EMAIL_PATTERN.test(normalizedEmail) || typeof password !== "string") {
      return next(new AppError("Provide a valid email and password", 400));
    }
    const patient = await Patient.findOne({ email: normalizedEmail }).select("+passwordHash");
    if (!patient || !(await bcrypt.compare(password, patient.passwordHash))) {
      return next(new AppError("Email or password is incorrect", 401));
    }
    res.json({ success: true, message: "Login successful", token: generateToken(patient._id), patient: safePatient(patient) });
  } catch (error) { next(error); }
};

export const getCurrentPatient = async (req, res, next) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.patientId)) return next(new AppError("Invalid authentication token", 401));
    const patient = await Patient.findById(req.patientId);
    if (!patient) return next(new AppError("Patient account no longer exists", 401));
    res.json({ success: true, patient: safePatient(patient) });
  } catch (error) { next(error); }
};

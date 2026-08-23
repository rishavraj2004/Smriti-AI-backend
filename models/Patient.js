import mongoose from "mongoose";

export const SUPPORTED_LANGUAGES = ["en", "hi", "as", "bn", "mn", "mz"];

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 120 },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    age: { type: Number, required: [true, "Age is required"], min: 1, max: 120 },
    language: { type: String, required: [true, "Language is required"], enum: SUPPORTED_LANGUAGES },
    region: { type: String, required: [true, "Region is required"], trim: true, maxlength: 120 },
    pairingCode: { type: String, required: true, unique: true, uppercase: true, immutable: true },
    caregiverId: { type: mongoose.Schema.Types.ObjectId, ref: "Caregiver", default: undefined },
  },
  { timestamps: true },
);

export default mongoose.model("Patient", patientSchema);

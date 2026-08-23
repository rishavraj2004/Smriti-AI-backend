import mongoose from "mongoose";

const caregiverSchema = new mongoose.Schema(
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
  },
  { timestamps: true },
);

export default mongoose.model("Caregiver", caregiverSchema);

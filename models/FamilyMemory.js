import mongoose from "mongoose";

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: [true, "Photo URL is required"] },
    order: { type: Number, default: 0 },
    caption: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const personSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Person name is required"], trim: true },
    relation: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const familyMemorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "userId is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Memory title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    occasion: {
      type: String,
      default: "",
      trim: true,
    },
    people: [personSchema],
    photos: [photoSchema],
    coverPhotoUrl: {
      type: String,
      default: "",
    },
    voice: {
      url: { type: String, default: "" },
      durationMs: { type: Number, default: 0 },
    },
    createdBy: {
      type: String,
      enum: ["patient", "caregiver"],
      default: "patient",
    },
  },
  { timestamps: true }
);

export default mongoose.model("FamilyMemory", familyMemorySchema);

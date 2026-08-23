import mongoose from "mongoose";

const chatLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    reply: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: String,
      default: "en",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for fast patient-specific chronological query
chatLogSchema.index({ userId: 1, createdAt: -1 });

const ChatLog = mongoose.model("ChatLog", chatLogSchema);

export default ChatLog;

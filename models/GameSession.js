import mongoose from "mongoose";

export const GAME_TYPES = [
  "memory",
  "attention",
  "math_memory",
  "object_recognition",
  "routine_recall",
  "word_association",
];

const gameSessionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient ID is required"],
      index: true,
    },
    gameType: {
      type: String,
      required: [true, "Game type is required"],
      enum: GAME_TYPES,
    },
    difficulty: {
      type: Number,
      required: [true, "Difficulty level is required"],
      enum: [1, 2, 3],
      default: 1,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    accuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    responseTimeMs: {
      type: Number,
      required: true,
      min: 0,
    },
    mistakes: {
      type: Number,
      default: 0,
      min: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      default: 1,
      min: 1,
    },
    completed: {
      type: Boolean,
      default: true,
    },
    performanceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant history and domain analytics
gameSessionSchema.index({ patientId: 1, createdAt: -1 });
gameSessionSchema.index({ patientId: 1, gameType: 1, createdAt: -1 });

export default mongoose.model("GameSession", gameSessionSchema);

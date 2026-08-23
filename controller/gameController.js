import mongoose from "mongoose";
import GameSession, { GAME_TYPES } from "../models/GameSession.js";
import Patient from "../models/Patient.js";
import AppError from "../utils/appError.js";
import { getNextGameForPatient } from "../services/gameService.js";
import { calculateOfficialScore } from "../services/scoringService.js";
import { calculateNextDifficulty } from "../services/adaptiveService.js";

/**
 * GET /api/games/next
 * Fetch the next recommended cognitive game configuration for the authenticated patient.
 */
export const getNextGame = async (req, res, next) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.patientId)) {
      return next(new AppError("Invalid patient authentication", 401));
    }

    const patient = await Patient.findById(req.patientId);
    if (!patient) {
      return next(new AppError("Patient profile not found", 404));
    }

    const { type, difficulty, lang, language } = req.query || {};
    const effectiveLang = language || lang || patient.language || "en";

    const game = await getNextGameForPatient(
      patient._id,
      type,
      difficulty,
      effectiveLang
    );

    res.json({
      success: true,
      game,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/games/session
 * Submit raw game interaction metrics, compute official performance score, save session, and calculate adaptive difficulty.
 */
export const submitGameSession = async (req, res, next) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.patientId)) {
      return next(new AppError("Invalid patient authentication", 401));
    }

    const {
      gameType,
      difficulty = 1,
      accuracy = 1.0,
      responseTimeMs = 15000,
      mistakes = 0,
      correctAnswers = 1,
      totalQuestions = 1,
      completed = true,
      startedAt,
    } = req.body || {};

    if (!gameType || !GAME_TYPES.includes(gameType)) {
      return next(new AppError("A valid gameType is required", 400));
    }

    const validDifficulty = Math.max(1, Math.min(3, Number(difficulty) || 1));
    const validAccuracy = Math.max(0, Math.min(1, Number(accuracy) || 0));
    const validResponseTime = Math.max(500, Number(responseTimeMs) || 10000);
    const validMistakes = Math.max(0, Number(mistakes) || 0);
    const validCorrect = Math.max(0, Number(correctAnswers) || 0);
    const validTotalQ = Math.max(1, Number(totalQuestions) || 1);
    const isCompleted = Boolean(completed);

    // Fetch previous scores for this patient to compute consistency & adaptive difficulty
    const previousSessions = await GameSession.find({ patientId: req.patientId })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const recentScores = previousSessions.map(s => s.performanceScore);

    // 1. Calculate Official Performance Score
    const { performanceScore, components } = calculateOfficialScore({
      accuracy: validAccuracy,
      responseTimeMs: validResponseTime,
      expectedTimeMs: validTotalQ * 4500,
      completed: isCompleted,
      recentScores,
    });

    // 2. Calculate Next Adaptive Difficulty
    const adaptation = calculateNextDifficulty(
      validDifficulty,
      performanceScore,
      recentScores
    );

    // 3. Save GameSession in MongoDB
    const sessionRecord = await GameSession.create({
      patientId: req.patientId,
      gameType,
      difficulty: validDifficulty,
      score: Math.round(validAccuracy * 100),
      accuracy: validAccuracy,
      responseTimeMs: validResponseTime,
      mistakes: validMistakes,
      correctAnswers: validCorrect,
      totalQuestions: validTotalQ,
      completed: isCompleted,
      performanceScore,
      startedAt: startedAt ? new Date(startedAt) : new Date(Date.now() - validResponseTime),
      completedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Game session recorded successfully",
      session: {
        id: sessionRecord._id.toString(),
        gameType: sessionRecord.gameType,
        difficulty: sessionRecord.difficulty,
        score: sessionRecord.score,
        accuracy: sessionRecord.accuracy,
        performanceScore: sessionRecord.performanceScore,
        responseTimeMs: sessionRecord.responseTimeMs,
        completedAt: sessionRecord.completedAt,
        components,
      },
      adaptation: {
        previousDifficulty: adaptation.previousDifficulty,
        nextDifficulty: adaptation.nextDifficulty,
        reason: adaptation.reason,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/games/history
 * Fetch patient's game sessions and cognitive domain averages.
 */
export const getGameHistory = async (req, res, next) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.patientId)) {
      return next(new AppError("Invalid patient authentication", 401));
    }

    const sessions = await GameSession.find({ patientId: req.patientId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    // Domain averages
    const domainScores = {
      memory: null,
      attention: null,
      mathMemory: null,
      objectRecognition: null,
      routineRecall: null,
      wordAssociation: null,
    };

    const domainTotals = {};
    const domainCounts = {};

    sessions.forEach(s => {
      let key = s.gameType;
      if (key === "math_memory") key = "mathMemory";
      if (key === "object_recognition") key = "objectRecognition";
      if (key === "routine_recall") key = "routineRecall";
      if (key === "word_association") key = "wordAssociation";

      domainTotals[key] = (domainTotals[key] || 0) + s.performanceScore;
      domainCounts[key] = (domainCounts[key] || 0) + 1;
    });

    Object.keys(domainCounts).forEach(key => {
      if (domainCounts[key] > 0) {
        domainScores[key] = Math.round(domainTotals[key] / domainCounts[key]);
      }
    });

    const totalGames = sessions.length;
    const avgScore =
      totalGames > 0
        ? Math.round(sessions.reduce((a, b) => a + b.performanceScore, 0) / totalGames)
        : null;

    res.json({
      success: true,
      totalGamesPlayed: totalGames,
      averagePerformance: avgScore,
      domainScores,
      sessions: sessions.map(s => ({
        id: s._id.toString(),
        gameType: s.gameType,
        difficulty: s.difficulty,
        score: s.score,
        accuracy: s.accuracy,
        performanceScore: s.performanceScore,
        responseTimeMs: s.responseTimeMs,
        completedAt: s.completedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

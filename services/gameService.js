import GameSession, { GAME_TYPES } from "../models/GameSession.js";
import { generateMemoryGame } from "../data/games/memory.js";
import { generateAttentionGame } from "../data/games/attention.js";
import { generateMathGame } from "../data/games/mathMemory.js";
import { generateObjectRecognitionGame } from "../data/games/objectRecognition.js";
import { generateRoutineRecallGame } from "../data/games/routineRecall.js";
import { generateWordAssociationGame } from "../data/games/wordAssociation.js";
import { calculateNextDifficulty, selectNextGameCategory } from "./adaptiveService.js";

/**
 * Generate game content based on gameType, difficulty, and language.
 */
export const buildGameConfig = (gameType = "memory", difficulty = 1, language = "en") => {
  const diff = Math.max(1, Math.min(3, Number(difficulty) || 1));
  const lang = typeof language === "string" ? language : "en";

  switch (gameType) {
    case "memory":
      return generateMemoryGame(diff, lang);
    case "attention":
      return generateAttentionGame(diff, lang);
    case "math_memory":
      return generateMathGame(diff, lang);
    case "object_recognition":
      return generateObjectRecognitionGame(diff, lang);
    case "routine_recall":
      return generateRoutineRecallGame(diff, lang);
    case "word_association":
      return generateWordAssociationGame(diff, lang);
    default:
      return generateMemoryGame(diff, lang);
  }
};

/**
 * Determine recommended game & adaptive difficulty for an authenticated patient.
 */
export const getNextGameForPatient = async (patientId, requestedType, requestedDifficulty, patientLanguage = "en") => {
  // Fetch patient recent game sessions
  const recentSessions = await GameSession.find({ patientId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Determine game category
  let targetGameType = requestedType;
  if (!targetGameType || !GAME_TYPES.includes(targetGameType)) {
    targetGameType = selectNextGameCategory(recentSessions);
  }

  // Determine difficulty level for this specific category or overall
  let targetDifficulty = Number(requestedDifficulty);
  if (!targetDifficulty || targetDifficulty < 1 || targetDifficulty > 3) {
    const categorySessions = recentSessions.filter(s => s.gameType === targetGameType);
    if (categorySessions.length > 0) {
      const latest = categorySessions[0];
      const recentScores = categorySessions.map(s => s.performanceScore);
      const adaptation = calculateNextDifficulty(latest.difficulty, latest.performanceScore, recentScores);
      targetDifficulty = adaptation.nextDifficulty;
    } else if (recentSessions.length > 0) {
      const latest = recentSessions[0];
      targetDifficulty = latest.difficulty || 1;
    } else {
      targetDifficulty = 1; // Cold start default = Easy
    }
  }

  // Generate game content
  const gameConfig = buildGameConfig(targetGameType, targetDifficulty, patientLanguage);

  return {
    ...gameConfig,
    patientId: patientId.toString(),
    sessionSeed: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
  };
};

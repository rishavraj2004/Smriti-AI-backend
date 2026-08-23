import { GAME_TYPES } from "../models/GameSession.js";

/**
 * Adaptive Difficulty Engine for Smriti AI.
 * Levels: 1 (Easy), 2 (Medium), 3 (Hard)
 */
export const calculateNextDifficulty = (
  currentDifficulty = 1,
  performanceScore = 75,
  recentScores = []
) => {
  const currentDiff = Math.max(1, Math.min(3, Number(currentDifficulty) || 1));

  // Use moving average if recent history is available to avoid overreacting to a single session
  let evalScore = performanceScore;
  if (Array.isArray(recentScores) && recentScores.length >= 2) {
    const sum = recentScores.slice(0, 3).reduce((a, b) => a + b, 0);
    evalScore = (sum + performanceScore) / (recentScores.slice(0, 3).length + 1);
  }

  let nextDifficulty = currentDiff;
  let reason = "Performance is within the target comfort zone.";

  if (evalScore >= 80) {
    if (currentDiff < 3) {
      nextDifficulty = currentDiff + 1;
      reason = "Excellent progress! Advancing to the next cognitive challenge.";
    } else {
      nextDifficulty = 3;
      reason = "Outstanding mastery at the highest difficulty level.";
    }
  } else if (evalScore < 50) {
    if (currentDiff > 1) {
      nextDifficulty = currentDiff - 1;
      reason = "Adjusting to a gentler pace to strengthen foundation.";
    } else {
      nextDifficulty = 1;
      reason = "Continuing at comfortable foundation level.";
    }
  } else {
    nextDifficulty = currentDiff;
    reason = "Consistent cognitive performance. Maintaining current level.";
  }

  return {
    previousDifficulty: currentDiff,
    nextDifficulty,
    evalScore: Math.round(evalScore),
    reason,
  };
};

/**
 * Deterministic Game Category Recommender.
 * Rotates or selects least recently practiced cognitive domains.
 */
export const selectNextGameCategory = (recentSessions = []) => {
  if (!recentSessions || recentSessions.length === 0) {
    return "memory";
  }

  const playedTypes = recentSessions.map(s => s.gameType);
  const unplayed = GAME_TYPES.filter(type => !playedTypes.includes(type));

  if (unplayed.length > 0) {
    return unplayed[0];
  }

  // Find least recently played type
  const lastPlayedIndices = {};
  GAME_TYPES.forEach(type => {
    const idx = playedTypes.indexOf(type);
    lastPlayedIndices[type] = idx === -1 ? 999 : idx;
  });

  const sortedByAge = [...GAME_TYPES].sort(
    (a, b) => lastPlayedIndices[b] - lastPlayedIndices[a]
  );

  return sortedByAge[0] || "memory";
};

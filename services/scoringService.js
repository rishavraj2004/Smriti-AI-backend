/**
 * Scoring Service for Smriti AI Cognitive Sessions.
 * Formula: 40% Accuracy + 30% Speed + 20% Consistency + 10% Completion
 */
export const calculateOfficialScore = ({
  accuracy = 1.0,
  responseTimeMs = 15000,
  expectedTimeMs = 20000,
  completed = true,
  recentScores = [],
}) => {
  // 1. Accuracy Component (0.0 to 1.0)
  const accuracyScore = Math.max(0, Math.min(1, Number(accuracy) || 0));

  // 2. Speed Component (0.3 to 1.0) - Gentle normalization for elderly pacing
  let speedScore = 0.8;
  if (responseTimeMs && responseTimeMs > 0) {
    const targetTime = expectedTimeMs > 0 ? expectedTimeMs : 20000;
    const ratio = targetTime / responseTimeMs;
    // Paced curve so slow responses do not excessively penalize elderly players
    speedScore = Math.max(0.35, Math.min(1.0, 0.6 + 0.4 * Math.min(1.0, ratio)));
  }

  // 3. Consistency Component (0.4 to 1.0)
  let consistencyScore = 0.8;
  if (Array.isArray(recentScores) && recentScores.length >= 2) {
    const avg = recentScores.reduce((acc, val) => acc + val, 0) / recentScores.length;
    const currentEst = (accuracyScore * 70) + (speedScore * 30);
    const deviation = Math.abs(currentEst - avg);
    consistencyScore = Math.max(0.4, Math.min(1.0, 1.0 - (deviation / 80)));
  }

  // 4. Completion Component (0.0 or 1.0)
  const completionScore = completed ? 1.0 : 0.2;

  // Weighted aggregate formula (0 to 100)
  const weighted =
    (0.40 * accuracyScore) +
    (0.30 * speedScore) +
    (0.20 * consistencyScore) +
    (0.10 * completionScore);

  const performanceScore = Math.round(Math.max(10, Math.min(100, weighted * 100)));

  return {
    performanceScore,
    components: {
      accuracyScore: Math.round(accuracyScore * 100),
      speedScore: Math.round(speedScore * 100),
      consistencyScore: Math.round(consistencyScore * 100),
      completionScore: Math.round(completionScore * 100),
    },
  };
};

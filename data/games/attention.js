export const ATTENTION_TARGETS = [
  { id: "rhino", symbol: "🦏", names: { en: "One-Horned Rhino", as: "এশিঙীয়া গঁড়", hi: "एक सींग वाला गैंडा", bn: "একশৃঙ্গ গণ্ডার", mn: "One-Horned Rhino", mz: "Samak Ki-khat" } },
  { id: "peacock", symbol: "🦚", names: { en: "Peacock", as: "ময়ূৰ", hi: "मोर", bn: "ময়ূর", mn: "Wahong", mz: "Rikhi" } },
  { id: "dhol", symbol: "🥁", names: { en: "Bihu Dhol", as: "বিহু ঢোল", hi: "बिहू ढोल", bn: "বিহু ঢোল", mn: "Bihu Dhol", mz: "Bihu Khuang" } },
  { id: "tea", symbol: "🍵", names: { en: "Tea Cup", as: "চাহৰ কাপ", hi: "चाय का प्याला", bn: "চায়ের কাপ", mn: "Tea Cup", mz: "Thingpui No" } },
  { id: "bell", symbol: "🔔", names: { en: "Temple Bell", as: "মন্দিৰৰ ঘণ্টা", hi: "मंदिर की घंटी", bn: "মন্দিরের ঘণ্টা", mn: "Temple Bell", mz: "Biak in Dar" } },
];

export const DISTRACTORS = ["🌸", "🍃", "🌾", "🎋", "🌺", "⭐", "🌿", "🦋", "🌼", "🍂"];

const TITLES = {
  as: "দৃষ্টি সংযোগ আৰু মনোযোগ",
  hi: "दृष्टि एकाग्रता और ध्यान",
  bn: "দৃষ্টি সংযোগ ও মনোযোগ",
  mn: "Visual Focus & Attention",
  mz: "Mit Vawm Leh Rilru Pek",
  en: "Visual Focus & Attention",
};

const INSTRUCTIONS = {
  as: "পৰ্দাৰ বস্তুবোৰৰ মাজৰ পৰা লক্ষ্য বস্তুটো বিচাৰি উলিয়াওক।",
  hi: "स्क्रीन पर अन्य वस्तुओं के बीच से लक्ष्य वस्तु को पहचानिए।",
  bn: "পর্দায় থাকা জিনিসগুলির মধ্য থেকে লক্ষ্য বস্তুটি খুঁজে বের করুন।",
  mn: "Find and tap the target item among the icons.",
  mz: "Thil dang zing atangin a zawn tur chu zawng chhuak rawh.",
  en: "Find and tap the target item hidden among the symbols on screen.",
};

export const generateAttentionGame = (difficulty = 1, lang = "en") => {
  const gridSizes = { 1: 9, 2: 16, 3: 25 };
  const targetCounts = { 1: 2, 2: 3, 3: 4 };
  const timeLimits = { 1: 45000, 2: 40000, 3: 30000 };

  const totalCells = gridSizes[difficulty] || 9;
  const numTargets = targetCounts[difficulty] || 2;

  const target = ATTENTION_TARGETS[Math.floor(Math.random() * ATTENTION_TARGETS.length)];
  const targetName = target.names[lang] || target.names.en;

  const cells = [];
  for (let i = 0; i < numTargets; i++) {
    cells.push({ id: `t-${i}`, symbol: target.symbol, isTarget: true, tapped: false });
  }

  while (cells.length < totalCells) {
    const randomDistractor = DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)];
    if (randomDistractor !== target.symbol) {
      cells.push({ id: `d-${cells.length}`, symbol: randomDistractor, isTarget: false, tapped: false });
    }
  }

  const shuffledCells = cells.sort(() => Math.random() - 0.5).map((c, idx) => ({ ...c, index: idx }));

  return {
    gameType: "attention",
    difficulty,
    title: TITLES[lang] || TITLES.en,
    instructions: INSTRUCTIONS[lang] || INSTRUCTIONS.en,
    content: {
      targetSymbol: target.symbol,
      targetName,
      totalTargets: numTargets,
      gridSize: totalCells,
      gridColumns: difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5,
      cells: shuffledCells,
    },
    settings: {
      timeLimitMs: timeLimits[difficulty],
      expectedTimeMs: numTargets * 5000,
    },
  };
};

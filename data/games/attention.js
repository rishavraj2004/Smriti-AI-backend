export const ATTENTION_ITEMS_POOL = [
  { id: "tea", symbol: "🌱", color: "#166534", names: { en: "Assam Tea Leaf", as: "অসম চাহপাত", hi: "असम चाय पत्ती", bn: "আসাম চা পাতা", mn: "Assam Tea Leaf", mz: "Thingpui Hnah" } },
  { id: "rhino", symbol: "🦏", color: "#475569", names: { en: "Kaziranga Rhino", as: "কাজিৰঙা গঁড়", hi: "काजीरंगा गैंडा", bn: "কাজিরাঙা গণ্ডার", mn: "Kaziranga Rhino", mz: "Kaziranga Samak" } },
  { id: "dhol", symbol: "🥁", color: "#B45309", names: { en: "Bihu Dhol", as: "বিহু ঢোল", hi: "बिहू ढोल", bn: "বিহু ঢোল", mn: "Bihu Dhol", mz: "Bihu Khuang" } },
  { id: "bamboo", symbol: "🎋", color: "#65A30D", names: { en: "Bamboo Craft", as: "বাঁহৰ শিল্প", hi: "बांस शिल्प", bn: "বাঁশের শিল্প", mn: "Bamboo Craft", mz: "Mau Hnathawh" } },
  { id: "flower", symbol: "🌸", color: "#DB2777", names: { en: "Rhodo Flower", as: "কপৌ ফুল", hi: "रोडोडेंड्रोन फूल", bn: "কপো ফুল", mn: "Leihao", mz: "Chhawkhlei" } },
  { id: "rain", symbol: "🌧️", color: "#0284C7", names: { en: "Cherrapunji Rain", as: "চেৰাপুঞ্জীৰ বৰষুণ", hi: "चेरापूंजी वर्षा", bn: "চেরাপুঞ্জির বৃষ্টি", mn: "Nong", mz: "Ruahsur" } },
  { id: "boat", symbol: "⛵", color: "#0D9488", names: { en: "Brahmaputra Boat", as: "ব্ৰহ্মপুত্ৰৰ নাও", hi: "ब्रह्मपुत्र नाव", bn: "ব্রহ্মপুত্র নৌকা", mn: "Hi", mz: "Lawng" } },
  { id: "cap", symbol: "👒", color: "#D97706", names: { en: "Jaapi Hat", as: "অসমীয়া জাপি", hi: "जापी टोपी", bn: "জাপি টুপি", mn: "Jaapi", mz: "Lukhum" } },
  { id: "bird", symbol: "🦜", color: "#15803D", names: { en: "Hornbill Bird", as: "ধনেশ পক্ষী", hi: "धनेश पक्षी", bn: "ধনেশ পাখি", mn: "Hornbill Uchek", mz: "Vahai" } },
];

export const generateAttentionGame = (difficulty = 1, lang = "en") => {
  const roundCounts = { 1: 4, 2: 5, 3: 6 };
  const gridSizes = { 1: 4, 2: 6, 3: 9 };
  const totalRounds = roundCounts[difficulty] || 5;
  const gridSize = gridSizes[difficulty] || 6;

  const rounds = [];

  for (let r = 0; r < totalRounds; r++) {
    const targetItem = ATTENTION_ITEMS_POOL[Math.floor(Math.random() * ATTENTION_ITEMS_POOL.length)];
    const distractors = ATTENTION_ITEMS_POOL
      .filter(i => i.id !== targetItem.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, gridSize - 1);

    const grid = [targetItem, ...distractors]
      .sort(() => Math.random() - 0.5)
      .map(item => ({
        id: item.id,
        symbol: item.symbol,
        color: item.color,
        name: item.names[lang] || item.names.en,
      }));

    rounds.push({
      roundNumber: r + 1,
      target: {
        id: targetItem.id,
        symbol: targetItem.symbol,
        color: targetItem.color,
        name: targetItem.names[lang] || targetItem.names.en,
      },
      grid,
    });
  }

  return {
    gameType: "attention",
    difficulty,
    title: "Visual Focus & Attention",
    instructions: "Look at the target item at the top and tap it in the grid below.",
    content: {
      totalRounds,
      gridSize,
      rounds,
    },
    settings: {
      timeLimitMs: totalRounds * 8000,
      expectedTimeMs: totalRounds * 3000,
    },
  };
};

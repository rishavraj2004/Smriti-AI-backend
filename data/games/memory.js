export const MEMORY_ITEMS_POOL = [
  { id: "tea", symbol: "🍵", names: { en: "Assam Tea Leaf", as: "অসমৰ চাহ পাত", hi: "असम चाय की पत्ती", bn: "আসাম চা পাতা", mn: "Assam Tea Leaf", mz: "Assam Thingpui" } },
  { id: "rhino", symbol: "🦏", names: { en: "Kaziranga Rhino", as: "কাজিৰঙাৰ গঁড়", hi: "काजीरंगा गैंडा", bn: "কাজিবাঙা গণ্ডার", mn: "Kaziranga Rhino", mz: "Kaziranga Samak" } },
  { id: "dhol", symbol: "🥁", names: { en: "Bihu Dhol", as: "বিহু ঢোল", hi: "बिहू ढोल", bn: "বিহু ঢোল", mn: "Bihu Dhol", mz: "Bihu Khuang" } },
  { id: "hornbill", symbol: "🪶", names: { en: "Hornbill Bird", as: "ধনেশ পক্ষী", hi: "धनेश पक्षी", bn: "ধনেশ পাখি", mn: "Hornbill Uchek", mz: "Vahai" } },
  { id: "bamboo", symbol: "🎋", names: { en: "Bamboo Craft", as: "বাঁহৰ শিল্প", hi: "बाँस शिल्प", bn: "বাঁশের শিল্প", mn: "Bamboo Craft", mz: "Mau Hnathawh" } },
  { id: "lake", symbol: "🏞️", names: { en: "Loktak Lake", as: "লোকটক হ্ৰদ", hi: "लोकटक झील", bn: "লোকটক হ্রদ", mn: "Loktak Pat", mz: "Loktak Dil" } },
  { id: "flower", symbol: "🌺", names: { en: "Rhodo Flower", as: "ৰঙা ফুল", hi: "रोडोडेंड्रॉन फूल", bn: "লাল ফুল", mn: "Leihao", mz: "Chhawkhlei" } },
  { id: "silk", symbol: "🧣", names: { en: "Muga Silk", as: "মুগা ৰেচম", hi: "मूगा सिल्क", bn: "মুগা সিল্ক", mn: "Muga Silk", mz: "Muga Silk Puan" } },
  { id: "mask", symbol: "🎭", names: { en: "Majuli Mask", as: "মাজুলীৰ মুখা", hi: "माजुली मुखौटा", bn: "মাজুলীর মুখোশ", mn: "Majuli Mask", mz: "Majuli Mask" } },
  { id: "bowl", symbol: "🥣", names: { en: "Jolpan Bowl", as: "জলপান বাটি", hi: "जलपान का कटोरा", bn: "জলখাবার বাটি", mn: "Jolpan Bowl", mz: "Tukthuan Thleng" } },
];

const TITLES = {
  as: "পৰম্পৰাগত স্মৃতি মেলাওক",
  hi: "पारंपरिक स्मृति मिलान",
  bn: "ঐতিহ্যবাহী স্মৃতি মেলান",
  mn: "Cultural Memory Match",
  mz: "Hriatzeu Inmilh",
  en: "Cultural Memory Match",
};

const INSTRUCTIONS = {
  as: "কাৰ্ডবোৰ লুটিয়াই পৰম্পৰাগত বস্তুবোৰৰ জোৰা মেলাওক।",
  hi: "कार्ड पलटकर पारंपरिक वस्तुओं के जोड़े मिलाइए।",
  bn: "কার্ড উল্টে ঐতিহ্যবাহী জিনিসের জোড়া মেলান।",
  mn: "Tap cards to flip and match pairs of traditional items.",
  mz: "Card thlep let la, thil inmil zawng rawh.",
  en: "Tap cards to flip and match pairs of traditional North-Eastern items.",
};

export const generateMemoryGame = (difficulty = 1, lang = "en") => {
  const pairCounts = { 1: 4, 2: 6, 3: 8 };
  const count = pairCounts[difficulty] || 4;
  const timeLimits = { 1: 60000, 2: 50000, 3: 40000 };

  const shuffled = [...MEMORY_ITEMS_POOL].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count).map(item => ({
    id: item.id,
    symbol: item.symbol,
    name: item.names[lang] || item.names.en,
  }));

  const deck = [...selected, ...selected]
    .sort(() => Math.random() - 0.5)
    .map((item, index) => ({
      id: index,
      itemId: item.id,
      symbol: item.symbol,
      name: item.name,
      isFlipped: false,
      isMatched: false,
    }));

  return {
    gameType: "memory",
    difficulty,
    title: TITLES[lang] || TITLES.en,
    instructions: INSTRUCTIONS[lang] || INSTRUCTIONS.en,
    content: {
      pairsCount: count,
      cards: deck,
    },
    settings: {
      timeLimitMs: timeLimits[difficulty],
      expectedTimeMs: count * 4000,
    },
  };
};

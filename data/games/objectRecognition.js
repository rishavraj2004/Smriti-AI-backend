export const RECOGNITION_BANK = [
  {
    symbol: "🦏",
    prompts: {
      en: "Which animal is the famous state animal of Assam found in Kaziranga?",
      as: "কাজিৰঙাত পোৱা অসমৰ প্ৰখ্যাত ৰাজ্যিক প্ৰাণীটো কি?",
      hi: "काजीरंगा में पाया जाने वाला असम का प्रसिद्ध राज्य पशु कौन सा है?",
      bn: "কাজিবাঙায় পাওয়া আসামের বিখ্যাত রাষ্ট্রীয় পশু কোনটি?",
      mn: "Which is the famous animal of Kaziranga?",
      mz: "Kaziranga ramhnuaia ramsa lar tak chu eng nge?",
    },
    correct: { en: "One-Horned Rhino", as: "এশিঙীয়া গঁড়", hi: "एक सींग वाला गैंडा", bn: "একশৃঙ্গ গণ্ডার", mn: "One-Horned Rhino", mz: "Samak Ki-khat" },
    distractors: [
      { en: "Royal Bengal Tiger", as: "ঢেঁকীয়াপতীয়া বাঘ", hi: "रॉयल बंगाल टाइगर", bn: "রয়েল বেঙ্গল টাইগার", mn: "Tiger", mz: "Sakei" },
      { en: "Wild Water Buffalo", as: "বনৰীয়া ম'হ", hi: "जंगली भैंस", bn: "বুনো মহিষ", mn: "Buffalo", mz: "Ramsial" },
      { en: "Golden Langur", as: "সোণালী বান্দৰ", hi: "गोल्डन लंगूर", bn: "সোনালী বানর", mn: "Langur", mz: "Zawng" },
    ],
  },
  {
    symbol: "🥁",
    prompts: {
      en: "Which traditional percussion instrument is played during Bihu celebrations?",
      as: "বিহু উৎসৱৰ সময়ত কোনটো পৰম্পৰাগত বাদ্যযন্ত্ৰ বজোৱা হয়?",
      hi: "बिहू उत्सव के दौरान कौन सा पारंपरिक वाद्य यंत्र बजाया जाता है?",
      bn: "বিহু উৎসবের সময় কোন ঐতিহ্যবাহী বাদ্যযন্ত্র বাজানো হয়?",
      mn: "Which instrument is played during Bihu?",
      mz: "Bihu kut laiin eng rimawi hmanrua nge an tum?",
    },
    correct: { en: "Bihu Dhol", as: "বিহু ঢোল", hi: "बिहू ढोल", bn: "বিহু ঢোল", mn: "Bihu Dhol", mz: "Bihu Khuang" },
    distractors: [
      { en: "Harmonium", as: "হাৰমনিয়াম", hi: "हारमोनियम", bn: "হারমোনিয়াম", mn: "Harmonium", mz: "Harmonium" },
      { en: "Bamboo Flute", as: "বাঁহৰ বাঁহী", hi: "बाँसुरी", bn: "বাঁশের বাঁশি", mn: "Flute", mz: "Phulit" },
      { en: "Violin", as: "বেহেলা", hi: "वायलिन", bn: "বেহালা", mn: "Violin", mz: "Violin" },
    ],
  },
  {
    symbol: "🍵",
    prompts: {
      en: "What refreshing drink is harvested in the rolling tea gardens across the Brahmaputra Valley?",
      as: "ব্ৰহ্মপুত্ৰ উপত্যকাৰ সেউজীয়া বাগিচাত কোনটো সতেজ পানীয় উৎপাদন কৰা হয়?",
      hi: "ब्रह्मपुत्र घाटी के चाय बागानों में कौन सा पेय पदार्थ उगाया जाता है?",
      bn: "ব্রহ্মপুত্র উপত্যকার সবুজ বাগানে কোন সতেজ পানীয় উৎপাদিত হয়?",
      mn: "What drink is harvested in tea gardens?",
      mz: "Thingpui huan atanga lak chhuah in tur chu eng nge?",
    },
    correct: { en: "Assam Orthodox Tea", as: "অসমৰ অৰ্থডক্স চাহ", hi: "असमिया चाय", bn: "আসাম চা", mn: "Assam Tea", mz: "Assam Thingpui" },
    distractors: [
      { en: "Coconut Water", as: "নাৰিকলৰ পানী", hi: "नारियल पानी", bn: "ডাবের জল", mn: "Coconut Water", mz: "Durtui" },
      { en: "Sugarcane Juice", as: "কুঁহিয়াৰৰ ৰস", hi: "गन्ने का रस", bn: "আখের রস", mn: "Sugarcane Juice", mz: "Futhlum Tui" },
      { en: "Coffee Bean", as: "কফি গুটি", hi: "कॉफी", bn: "কফি বিন", mn: "Coffee", mz: "Kawphi" },
    ],
  },
  {
    symbol: "🎋",
    prompts: {
      en: "Which sturdy natural green grass is crafted into baskets, furniture, and walking sticks?",
      as: "কোনটো প্ৰাকৃতিক গছৰ পৰা পাচি, আচবাব আৰু লাখুটি তৈয়াৰ কৰা হয়?",
      hi: "किस प्राकृतिक सामग्री से टोकरियाँ, फर्नीचर और लाठी बनाई जाती है?",
      bn: "কোন প্রাকৃতিক উপাদান দিয়ে ঝুড়ি, আসবাবপত্র ও লাঠি তৈরি হয়?",
      mn: "Which plant is used to make baskets and furniture?",
      mz: "Eng hnahthawh hmanrua nge bawm leh thutthleng siam nan an hman?",
    },
    correct: { en: "Assam Bamboo (Banh)", as: "জাতি বাঁহ", hi: "बाँस", bn: "বাঁশ", mn: "Bamboo", mz: "Mau" },
    distractors: [
      { en: "Oak Wood", as: "ওক কাঠ", hi: "ओक की लकड़ी", bn: "ওক কাঠ", mn: "Oak", mz: "Oak Thing" },
      { en: "Pine Tree", as: "সৰল গছ", hi: "चीड़ का पेड़", bn: "পাইন গাছ", mn: "Pine", mz: "Far Thing" },
      { en: "Palm Frond", as: "তাল গছ", hi: "ताड़ का पत्ता", bn: "তাল পাতা", mn: "Palm", mz: "Tum" },
    ],
  },
];

const TITLES = {
  as: "বস্তু আৰু ঐতিহ্য পৰিচিতি",
  hi: "वस्तु और सांस्कृतिक पहचान",
  bn: "জিনিস ও ঐতিহ্য চেনা",
  mn: "Object Recognition",
  mz: "Thil Hriatchhuah",
  en: "Cultural Object Recognition",
};

const INSTRUCTIONS = {
  as: "প্ৰশ্নটো পঢ়ি শুদ্ধ পৰম্পৰাগত বস্তুটো বাছনি কৰক।",
  hi: "प्रश्न पढ़कर सही पारंपरिक वस्तु का चयन कीजिए।",
  bn: "প্রশ্নটি পড়ে সঠিক ঐতিহ্যবাহী বস্তুটি নির্বাচন করুন।",
  mn: "Read the prompt and select the matching cultural object.",
  mz: "Zawhna chhiar la, a dik ber thlang rawh.",
  en: "Read the cultural prompt and select the matching object option.",
};

export const generateObjectRecognitionGame = (difficulty = 1, lang = "en") => {
  const qCounts = { 1: 3, 2: 4, 3: 4 };
  const targetCount = qCounts[difficulty] || 3;

  const shuffledBank = [...RECOGNITION_BANK].sort(() => Math.random() - 0.5);
  const selected = shuffledBank.slice(0, targetCount).map((item, idx) => {
    const correctName = item.correct[lang] || item.correct.en;
    const distractorNames = item.distractors.map(d => d[lang] || d.en);
    const allOptions = [correctName, ...distractorNames].sort(() => Math.random() - 0.5);

    return {
      id: idx + 1,
      symbol: item.symbol,
      prompt: item.prompts[lang] || item.prompts.en,
      correctAnswer: correctName,
      options: allOptions,
    };
  });

  return {
    gameType: "object_recognition",
    difficulty,
    title: TITLES[lang] || TITLES.en,
    instructions: INSTRUCTIONS[lang] || INSTRUCTIONS.en,
    content: {
      questionsCount: selected.length,
      questions: selected,
    },
    settings: {
      timeLimitMs: selected.length * 20000,
      expectedTimeMs: selected.length * 8000,
    },
  };
};

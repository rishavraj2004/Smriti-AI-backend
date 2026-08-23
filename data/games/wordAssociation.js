export const WORD_ASSOCIATION_BANK = [
  {
    stimulus: {
      en: "Assam Tea (Chah)",
      as: "অসমৰ চাহ",
      hi: "असम की चाय",
      bn: "আসামের চা",
      mn: "Assam Tea",
      mz: "Assam Thingpui",
    },
    hint: "🍵",
    correct: {
      en: "Tea Garden & Morning Mist",
      as: "সেউজ চাহ বাগিচা আৰু পুৱাৰ কুঁৱলী",
      hi: "चाय बागान और सुबह की ठंडक",
      bn: "সবুজ চা বাগান ও সকালের কুয়াশা",
      mn: "Tea Garden & Morning",
      mz: "Thingpui Huan & Zing Thlifim",
    },
    distractors: [
      { en: "Deep Sea Diving", as: "সাগৰৰ গভীৰত ডুব", hi: "समुद्र की गहराई", bn: "গভীর সমুদ্রে ডুব", mn: "Sea Diving", mz: "Tuifinriat Thuk" },
      { en: "Desert Sand Dunes", as: "মৰুভূমিৰ বালি", hi: "रेगिस्तान की रेत", bn: "মরুভূমির বালি", mn: "Desert Sand", mz: "Thalerh Ram" },
      { en: "Ice Skating Rink", as: "বৰফৰ ওপৰত পিছল খোৱা", hi: "बर्फ पर स्केटिंग", bn: "বরফের স্কেটিং", mn: "Ice Skating", mz: "Vur Chunga Ttiah" },
    ],
  },
  {
    stimulus: {
      en: "Bihu Festival",
      as: "ৰঙালী বিহু",
      hi: "बिहू उत्सव",
      bn: "বিহু উৎসব",
      mn: "Bihu Festival",
      mz: "Bihu Kut",
    },
    hint: "🌸",
    correct: {
      en: "Spring Season & Dhol Drum",
      as: "বসন্ত কাল আৰু ঢোলৰ মাত",
      hi: "वसंत ऋतु और ढोल की धुन",
      bn: "বসন্ত কাল ও ঢোলের আওয়াজ",
      mn: "Spring & Dhol",
      mz: "Thal Lai & Khuang Ri",
    },
    distractors: [
      { en: "Snow Blizzard", as: "তুষাৰপাত আৰু ধুমুহা", hi: "बर्फ़ीला तूफ़ान", bn: "তুষার ঝড়", mn: "Snow Storm", mz: "Vur Thlipui" },
      { en: "Traffic Jam", as: "ৰাস্তাৰ যান-জঁট", hi: "ट्रैफिक जाम", bn: "ট্রাফিক জ্যাম", mn: "Traffic Jam", mz: "Motor Tang" },
      { en: "Heavy Factory Smoke", as: "কাৰখানাৰ ক'লা ধোঁৱা", hi: "कारखाने का धुआं", bn: "কারখানার ধোঁয়া", mn: "Factory Smoke", mz: "Meikhu" },
    ],
  },
  {
    stimulus: {
      en: "Brahmaputra River",
      as: "ব্ৰহ্মপুত্ৰ নদী",
      hi: "ब्रह्मपुत्र नदी",
      bn: "ব্রহ্মপুত্র নদী",
      mn: "Brahmaputra River",
      mz: "Brahmaputra Luipui",
    },
    hint: "🌊",
    correct: {
      en: "Majuli River Island & Ferry",
      as: "মাজুলী দ্বীপ আৰু ফেৰী জাহাজ",
      hi: "माजुली द्वीप और नाव यात्रा",
      bn: "মাজুলী দ্বীপ ও ফেরি নৌকা",
      mn: "Majuli Island & Boat",
      mz: "Majuli Thliarkar & Lawng",
    },
    distractors: [
      { en: "Volcano Eruption", as: "আগ্নেয়গিৰিৰ উদগীৰণ", hi: "ज्वालामुखी विस्फोट", bn: "আগ্নেয়গিরির অগ্ন্যুৎপাত", mn: "Volcano", mz: "Tlang Kang" },
      { en: "Dry Cactus Desert", as: "কেকটাছ ভৰা শুকান মৰুভূমি", hi: "सूखा रेगिस्तान", bn: "শুষ্ক মরুভূমি", mn: "Dry Desert", mz: "Hling Nei Thalerh" },
      { en: "Underground Metro Tunnel", as: "মাটিৰ তলৰ মেট্ৰ' ৰেল", hi: "भूमिगत मेट्रो सुरंग", bn: "পাতাল রেল টানেল", mn: "Metro Tunnel", mz: "Leihnuai Kawng" },
    ],
  },
];

const TITLES = {
  as: "শব্দ আৰু অৰ্থৰ সম্পৰ্ক",
  hi: "शब्द और अर्थ सहचर्य",
  bn: "শব্দ ও অর্থের সম্পর্ক",
  mn: "Word Association",
  mz: "Tawngkam Inzawmna",
  en: "Word Association & Context",
};

const INSTRUCTIONS = {
  as: "মুখ্য শব্দটো পঢ়ি তাৰ লগত সৰ্বাধিক মিলি থকা ধাৰণাটো বাছনি কৰক।",
  hi: "मुख्य शब्द को पढ़कर उससे सबसे अधिक संबंधित विकल्प का चयन कीजिए।",
  bn: "মূল শব্দটি পড়ে তার সাথে সবচেয়ে সম্পর্কিত ধারণাটি নির্বাচন করুন।",
  mn: "Select the phrase most related to the stimulus word.",
  mz: "Tawngkam zawn a awmze inmil ber thlang rawh.",
  en: "Read the stimulus word and select the most related cultural concept.",
};

export const generateWordAssociationGame = (difficulty = 1, lang = "en") => {
  const targetCount = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 3;
  const shuffled = [...WORD_ASSOCIATION_BANK].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, targetCount).map((item, idx) => {
    const stimulus = item.stimulus[lang] || item.stimulus.en;
    const correct = item.correct[lang] || item.correct.en;
    const distractors = item.distractors.map(d => d[lang] || d.en);
    const options = [correct, ...distractors].sort(() => Math.random() - 0.5);

    return {
      id: idx + 1,
      stimulus,
      hint: item.hint,
      correctAnswer: correct,
      options,
    };
  });

  return {
    gameType: "word_association",
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

export const ROUTINE_STEPS_POOL = [
  {
    id: "step-1",
    order: 1,
    emoji: "🌅",
    timeSlot: "7:00 AM",
    titles: {
      en: "Morning Walk & Warm Tea",
      as: "পুৱাৰ খোজ কঢ়া আৰু চাহ খোৱা",
      hi: "सुबह की सैर और गर्म चाय",
      bn: "সকালের হাঁটা ও গরম চা",
      mn: "Morning Walk & Warm Tea",
      mz: "Zing boruak tha luh leh thingpui",
    },
  },
  {
    id: "step-2",
    order: 2,
    emoji: "🧠",
    timeSlot: "9:30 AM",
    titles: {
      en: "Cognitive Games & Memory Time",
      as: "মগজুৰ খেল আৰু স্মৃতি অনুশীলন",
      hi: "मस्तिष्क के खेल और स्मृति अभ्यास",
      bn: "মস্তিষ্কের খেলা ও স্মৃতি অনুশীলন",
      mn: "Cognitive Games & Memory Practice",
      mz: "Thluak tihhriamna infiamna",
    },
  },
  {
    id: "step-3",
    order: 3,
    emoji: "🍲",
    timeSlot: "1:00 PM",
    titles: {
      en: "Nourishing Lunch with Family",
      as: "পৰিয়ালৰ সৈতে দুপৰীয়াৰ আহাৰ",
      hi: "परिवार के साथ दोपहर का पौष्टिक भोजन",
      bn: "পরিবারের সাথে দুপুরের খাবার",
      mn: "Nourishing Lunch with Family",
      mz: "Chhun chaw ei hlimawm",
    },
  },
  {
    id: "step-4",
    order: 4,
    emoji: "🍵",
    timeSlot: "4:30 PM",
    titles: {
      en: "Evening Assam Tea & Garden Stroll",
      as: "গধূলিৰ চাহ আৰু ফুলনি ফুৰা",
      hi: "शाम की चाय और बगीचे में टहलना",
      bn: "সন্ধ্যার চা ও বাগানে ঘোরা",
      mn: "Evening Tea & Garden Walk",
      mz: "Tlai thingpui leh huan luh",
    },
  },
  {
    id: "step-5",
    order: 5,
    emoji: "🌙",
    timeSlot: "9:00 PM",
    titles: {
      en: "Night Medicine & Peaceful Sleep",
      as: "ৰাতিৰ ঔষধ আৰু নিৰিবিলি টোপনি",
      hi: "रात की दवाई और शांत नींद",
      bn: "রাতের ওষুধ ও শান্তিপূর্ণ ঘুম",
      mn: "Night Medicine & Restful Sleep",
      mz: "Zan damdawi ei leh mut hma",
    },
  },
];

export const generateRoutineRecallGame = (difficulty = 1, lang = "en") => {
  const stepCounts = { 1: 3, 2: 4, 3: 5 };
  const count = stepCounts[difficulty] || 4;

  const selectedSteps = ROUTINE_STEPS_POOL.slice(0, count).map((step, idx) => ({
    id: step.id,
    order: idx + 1,
    emoji: step.emoji,
    timeSlot: step.timeSlot,
    title: step.titles[lang] || step.titles.en,
  }));

  const shuffledPool = [...selectedSteps].sort(() => Math.random() - 0.5);

  return {
    gameType: "routine_recall",
    difficulty,
    title: "Daily Routine Recall & Rhythm",
    instructions: "Arrange the daily routine tasks in the correct chronological order.",
    content: {
      stepsCount: count,
      correctSequence: selectedSteps,
      availableSteps: shuffledPool,
    },
    settings: {
      timeLimitMs: count * 15000,
      expectedTimeMs: count * 5000,
    },
  };
};

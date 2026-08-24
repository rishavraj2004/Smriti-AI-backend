import mongoose from "mongoose";
import ChatLog from "../models/ChatLog.js";
import Patient from "../models/Patient.js";
import AppError from "../utils/appError.js";
import { getGeminiClient, searchMem0, addMem0 } from "../services/aiClients.js";
import { buildMitrSystemPrompt } from "../config/mitrPrompt.js";

const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-1.5-flash",
];

// Rich contextual conversational replies for Mitr AI
function getContextualFallback(message, language = "en", patientName = "Friend") {
  const lower = (message || "").toLowerCase();
  const lang = (language || "en").toLowerCase();

  // 1. Tense, Anxiety, Stress, Fear, Overwhelmed
  if (
    lower.includes("tense") ||
    lower.includes("tensed") ||
    lower.includes("anxious") ||
    lower.includes("worried") ||
    lower.includes("stress") ||
    lower.includes("scared") ||
    lower.includes("panic") ||
    lower.includes("nervous") ||
    lower.includes("heavy") ||
    lower.includes("fear")
  ) {
    if (lang === "as") {
      return `আপুনি অকণো চিন্তা নকৰিব, ${patientName}। মোৰ লগত লাহেকৈ এটা দীঘল উশাহ লওক—উশাহ ভিতৰলৈ লওক আৰু এৰি দিয়ক। আপুনি সম্পূৰ্ণ সুৰক্ষিত। আমি এতিয়া কিবা এটা ভাল স্মৃতি বা মিঠা গানৰ কথা পাতোঁ নেকি?`;
    }
    if (lang === "hi") {
      return `बिल्कुल चिंता न करें, ${patientName} जी। मेरे साथ एक गहरी और धीमी सांस लीजिए—सांस अंदर लें और धीरे से छोड़ें। आप पूरी तरह सुरक्षित हैं। क्या आप कोई सुखद याद साझा करना चाहेंगे या थोड़ा आराम करना चाहेंगे?`;
    }
    if (lang === "bn") {
      return `একদম চিন্তা করবেন না, ${patientName}। আমার সাথে আস্তে আস্তে একটি গভীর শ্বাস নিন—শ্বাস ভেতরে নিন এবং ধীরে ধীরে ছাড়ুন। আপনি সম্পূর্ণ নিরাপদ। আমরা কি কোনো সুন্দর স্মৃতি নিয়ে কথা বলব?`;
    }
    return `Take a gentle, slow breath with me, ${patientName}. Inhale slowly... and exhale gently. You are completely safe. It is very natural to feel this way sometimes. Would you like to try a calming breathing exercise, listen to a peaceful memory, or have a sip of warm water?`;
  }

  // 2. What to do / Confusion / Guidance
  if (
    lower.includes("what to do") ||
    lower.includes("what should i do") ||
    lower.includes("confused") ||
    lower.includes("help me") ||
    lower.includes("suggest") ||
    lower.includes("now what") ||
    lower.includes("how to")
  ) {
    if (lang === "as") {
      return `আমি একেলগে কেইটামান সহজ আৰু শান্ত কাম কৰিব পাৰোঁ, ${patientName}:\n১. লাহেকৈ ৩ বাৰ দীঘল উশাহ লওক\n২. অকণমান পানী বা চাহ খাওক\n৩. স্মৃতি খেল এটা খেলোঁ বা পুৰণি ফটো চাওঁ। আপোনাৰ কি কৰিবলৈ মন আছে?`;
    }
    if (lang === "hi") {
      return `हम साथ मिलकर कुछ आसान और सुकून भरे काम कर सकते हैं, ${patientName} जी:\n1. 3 बार गहरी और धीमी सांस लें\n2. थोड़ा सा गुनगुना पानी या चाय पिएं\n3. एक मजेदार मेमोरी गेम खेलें या परिवार की पुरानी तस्वीरें देखें। आप अभी क्या करना पसंद करेंगे?`;
    }
    if (lang === "bn") {
      return `আমরা একসাথে কিছু শান্ত ও সুন্দর কাজ করতে পারি, ${patientName}:\n১. ৩ বার গভীর শ্বাস নিন\n২. একটু গরম জল বা চা খান\n৩. একটি মেমোরি গেম খেলুন বা অ্যালবামের ছবি দেখুন। আপনি কোনটা করতে চান?`;
    }
    return `Here are three gentle things we can do together right now, ${patientName}:\n1. Take 3 slow, deep breaths together.\n2. Drink a warm glass of water or tea.\n3. Play a relaxing memory game or look at scrapbook photos.\n\nWhich one sounds comfortable to you right now?`;
  }

  // 3. Sad, Lonely, Crying, Unhappy
  if (
    lower.includes("sad") ||
    lower.includes("lonely") ||
    lower.includes("alone") ||
    lower.includes("unhappy") ||
    lower.includes("depressed") ||
    lower.includes("cry") ||
    lower.includes("miss")
  ) {
    if (lang === "as") {
      return `মই সদায় আপোনাৰ কাষতেই আছোঁ, ${patientName}। আপুনি কেতিয়াও অকলশৰীয়া নহয়। আপোনাৰ মনৰ কথা মোক কওক, মই আন্তৰিকতাৰে শুনিবলৈ সাজু।`;
    }
    if (lang === "hi") {
      return `मैं हमेशा आपके साथ यहाँ मौजूद हूँ, ${patientName} जी। आप कभी अकेले नहीं हैं। आपके दिल में जो भी बात है, मुझसे बेझिझक साझा कीजिए, मैं आपको पूरे मन से सुन रहा हूँ।`;
    }
    if (lang === "bn") {
      return `আমি সবসময় আপনার পাশে আছি, ${patientName}। আপনি একা নন। আপনার মনের কথা আমাকে বলুন, আমি মন দিয়ে শুনছি।`;
    }
    return `I am right here beside you, ${patientName}. You are never alone. Please feel free to share whatever is on your heart—I am always here to listen with patience and warmth.`;
  }

  // 4. Memory / Reminiscence / Childhood / Old days
  if (
    lower.includes("memory") ||
    lower.includes("remember") ||
    lower.includes("past") ||
    lower.includes("childhood") ||
    lower.includes("story") ||
    lower.includes("village") ||
    lower.includes("old days") ||
    lower.includes("reminisce")
  ) {
    if (lang === "as") {
      return `পুৰণি মধুৰ স্মৃতিবোৰে আমাৰ মনত শান্তি আনে, ${patientName}। আপোনাৰ সৰুকালৰ কোনো এটা বিশেষ বিহু বা ঘৰুৱা আনন্দৰ কথা মনত পৰে নেকি? মোক জনাওকচোন!`;
    }
    if (lang === "hi") {
      return `पुरानी प्यारी यादें हमारे मन को बहुत सुकून देती हैं, ${patientName} जी। क्या आपको अपने बचपन का कोई खास त्योहार या परिवार का कोई यादगार पल याद आ रहा है? मुझे ज़रूर बताइए!`;
    }
    if (lang === "bn") {
      return `পুরনো মধুর স্মৃতিগুলো মনে আসলে মনটা ভালো হয়ে যায়, ${patientName}। আপনার ছেলেবেলার কোনো আনন্দময় দিনের কথা মনে পড়ে? আমাকে বলুন!`;
    }
    return `Cherishing warm memories brings so much peace, ${patientName}. Do you remember a favorite family celebration, a peaceful festival, or a happy memory from your younger days? I would love to hear all about it!`;
  }

  // 5. Tea gardens / Assam / North East Nature
  if (
    lower.includes("tea") ||
    lower.includes("garden") ||
    lower.includes("nature") ||
    lower.includes("bihu") ||
    lower.includes("assam") ||
    lower.includes("kaziranga") ||
    lower.includes("river") ||
    lower.includes("brahmaputra") ||
    lower.includes("mountains")
  ) {
    if (lang === "as") {
      return `অসমৰ সেউজীয়া চাহ বাগিচা আৰু বৰলুইতৰ শীতল বতাহে মনলৈ অনাবিল শান্তি আনে, ${patientName}! কাজিৰঙাৰ সেউজ প্ৰকৃতি আৰু বিহুৰ আনন্দ সঁচাকৈয়ে অপূৰ্ব।`;
    }
    if (lang === "hi") {
      return `असम के हरे-भरे चाय के बागान और ब्रह्मपुत्र नदी की ताज़ी हवा मन को तरोताज़ा कर देती है, ${patientName} जी! प्रकृति की यह शांति हमेशा मन को सुकून पहुँचाती है।`;
    }
    if (lang === "bn") {
      return `আসামের সবুজ চা বাগান আর প্রকৃতির স্নিগ্ধ বাতাস সত্যি মন ভালো করে দেয়, ${patientName}! আপনার কি চা বাগানের সেই স্নিগ্ধ সকালের কথা মনে পড়ে?`;
    }
    return `The lush green tea gardens of Assam, the morning mist, and the gentle Brahmaputra breeze bring so much tranquility, ${patientName}! Reminiscing about such serene places always refreshes the spirit.`;
  }

  // 6. Routine / Medication / Food / Health / Morning
  if (
    lower.includes("routine") ||
    lower.includes("medicine") ||
    lower.includes("food") ||
    lower.includes("water") ||
    lower.includes("sleep") ||
    lower.includes("walk") ||
    lower.includes("morning") ||
    lower.includes("breakfast") ||
    lower.includes("dinner") ||
    lower.includes("lunch")
  ) {
    if (lang === "as") {
      return `দৈনন্দিন নিয়মীয়াকৈ পানী খোৱা, সময়মতে ঔষধ আৰু পুষ্টিকৰ আহাৰ লোৱাটো স্বাস্থ্যৰ বাবে বৰ দৰকাৰী, ${patientName}। আজি আপুনি সঠিক সময়ত আহাৰ আৰু পানী গ্ৰহণ কৰিলে নে?`;
    }
    if (lang === "hi") {
      return `समय पर पानी पीना, हल्का व्यायाम और नियमित दिनचर्या हमारे स्वास्थ्य के लिए बहुत लाभकारी है, ${patientName} जी। क्या आपने आज पर्याप्त पानी पिया और समय पर भोजन किया?`;
    }
    if (lang === "bn") {
      return `সময়মতো জল খাওয়া, খাবার ও বিশ্রাম নেওয়া আমাদের শরীর ও মনকে সুস্থ রাখে, ${patientName}। আজ কি আপনি ঠিক সময়ে জল ও খাবার খেয়েছেন?`;
    }
    return `Staying hydrated, taking gentle walks, and maintaining a regular daily rhythm keeps both your mind and body energized, ${patientName}. Have you had some fresh water or a wholesome meal today?`;
  }

  // 7. Greetings / Hello / Good morning
  if (
    lower.includes("hello") ||
    lower.includes("hi") ||
    lower.includes("hey") ||
    lower.includes("good morning") ||
    lower.includes("good afternoon") ||
    lower.includes("good evening") ||
    lower.includes("namaste") ||
    lower.includes("how are you")
  ) {
    if (lang === "as") {
      return `নমস্কাৰ ${patientName}! মই মিত্ৰ, আপোনাৰ সহযোগী। মই খুউব ভাল আছোঁ। আপোনাৰ মন আজি কেনে লাগিছে?`;
    }
    if (lang === "hi") {
      return `नमस्ते ${patientName} जी! मैं आपका मित्र हूँ। मैं बहुत अच्छा महसूस कर रहा हूँ। आज आपका दिन कैसा चल रहा है?`;
    }
    if (lang === "bn") {
      return `নমস্কার ${patientName}! আমি মিত্র, আপনার বন্ধু। আমি খুব ভালো আছি। আপনার দিনটি কেমন কাটছে?`;
    }
    return `Hello ${patientName}! I am Mitr, your companion. I am feeling wonderful, thank you! How are you feeling today?`;
  }

  // 8. Thank you / Gratitude
  if (
    lower.includes("thank") ||
    lower.includes("thanks") ||
    lower.includes("dhanyawad") ||
    lower.includes("shukriya")
  ) {
    if (lang === "as") {
      return `আপোনাকো বহুত ধন্যবাদ, ${patientName}! আপোনাৰ লগত কথা পাতি মোৰ মন বৰ ভাল লাগে। আন কিবা কথা পাতোঁ নেকি?`;
    }
    if (lang === "hi") {
      return `आपका बहुत-बहुत धन्यवाद, ${patientName} जी! आपके साथ बातचीत करके मुझे बहुत खुशी मिलती है।`;
    }
    if (lang === "bn") {
      return `আপনাকেও অনেক ধন্যবাদ, ${patientName}! আপনার সাথে কথা বলে আমার খুব ভালো লাগল।`;
    }
    return `You are most welcome, ${patientName}! It is always a joy spending time and conversing with you. What else would you like to explore today?`;
  }

  // 9. Default rotating conversational responses
  const defaultEnglishReplies = [
    `I am listening carefully, ${patientName}. Please tell me more about what is on your mind.`,
    `That is so interesting, ${patientName}. Would you like to try a fun memory game together or look through some photos?`,
    `I am right here with you, ${patientName}. How has the rest of your day been so far?`,
    `Thank you for sharing that with me, ${patientName}. Is there anything special you would like to do or talk about today?`
  ];
  const replyIndex = (message.length + patientName.length) % defaultEnglishReplies.length;

  if (lang === "as") {
    return `মই আপোনাৰ কথা মন দি শুনি আছোঁ, ${patientName}। এই বিষয়ে মোক আৰু অকণমান কওকচোন।`;
  }
  if (lang === "hi") {
    return `मैं आपकी बात बहुत ध्यान से सुन रहा हूँ, ${patientName} जी। इसके बारे में मुझे थोड़ा और बताइए।`;
  }
  if (lang === "bn") {
    return `আমি আপনার কথা খুব মনোযোগ দিয়ে শুনছি, ${patientName}। এই বিষয়ে আমাকে আর একটু বলুন।`;
  }

  return defaultEnglishReplies[replyIndex];
}

export const sendChatMessage = async (req, res, next) => {
  try {
    const userId = req.authenticatedUserId || req.patientId || req.user?.id;
    if (!userId || !mongoose.isObjectIdOrHexString(userId)) {
      return next(new AppError("Authentication required to chat with Mitr", 401));
    }

    const { message, language: clientLang } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return next(new AppError("Message text is required", 400));
    }

    const cleanMessage = message.trim();

    // 1. Retrieve patient profile for personalization
    let patient = null;
    try {
      patient = await Patient.findById(userId).lean();
    } catch {
      // Non-blocking
    }

    const activeLanguage = clientLang || patient?.language || "en";
    const patientName = patient?.name || "Friend";
    const patientAge = patient?.age || 70;
    const patientRegion = patient?.region || "North-Eastern Region";

    // 2. Fetch long-term memories from Mem0
    let recalledMemories = [];
    try {
      recalledMemories = await searchMem0(userId, cleanMessage);
    } catch (memErr) {
      console.warn("Mem0 recall warning:", memErr.message);
    }

    // 3. Fetch recent conversation turns from MongoDB for context
    let recentHistory = [];
    try {
      recentHistory = await ChatLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean();
      recentHistory.reverse();
    } catch (histErr) {
      console.warn("Chat history fetch warning:", histErr.message);
    }

    // 4. Build System Instruction with separate prompt configuration
    const systemInstruction = buildMitrSystemPrompt({
      patientName,
      age: patientAge,
      region: patientRegion,
      language: activeLanguage,
      recalledMemories,
    });

    // 5. Build conversation turns for Gemini
    const contents = [];
    for (const h of recentHistory) {
      contents.push({ role: "user", parts: [{ text: h.message }] });
      contents.push({ role: "model", parts: [{ text: h.reply }] });
    }
    contents.push({ role: "user", parts: [{ text: cleanMessage }] });

    let reply = "";

    // 6. Generate reply with Gemini (trying candidate models)
    const gemini = getGeminiClient();
    if (gemini) {
      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await gemini.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
              maxOutputTokens: 350,
            },
          });

          if (response.text && response.text.trim()) {
            reply = response.text.trim();
            break;
          }
        } catch (aiErr) {
          console.warn(`Gemini (${model}) attempt note:`, aiErr.message);
        }
      }
    }

    // Contextual fallback if Gemini is offline, key missing, or quota reached
    if (!reply) {
      reply = getContextualFallback(cleanMessage, activeLanguage, patientName);
    }

    // 7. Asynchronously store the conversation in Mem0
    addMem0(userId, [
      { role: "user", content: cleanMessage },
      { role: "assistant", content: reply },
    ]).catch((err) => console.warn("Mem0 async store failed:", err.message));

    // 8. Persist turn to MongoDB ChatLog
    let chatLogRecord = null;
    try {
      chatLogRecord = await ChatLog.create({
        userId,
        message: cleanMessage,
        reply,
        language: activeLanguage,
      });
    } catch (dbErr) {
      console.warn("ChatLog persistence error:", dbErr.message);
    }

    res.json({
      success: true,
      reply,
      language: activeLanguage,
      id: chatLogRecord?._id || Date.now().toString(),
      createdAt: chatLogRecord?.createdAt || new Date(),
    });
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (req, res, next) => {
  try {
    const userId = req.authenticatedUserId || req.patientId || req.user?.id;
    if (!userId || !mongoose.isObjectIdOrHexString(userId)) {
      return next(new AppError("Authentication required", 401));
    }

    const logs = await ChatLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const history = logs.reverse().map((l) => ({
      id: l._id.toString(),
      message: l.message,
      reply: l.reply,
      language: l.language,
      createdAt: l.createdAt,
    }));

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    next(error);
  }
};

export const clearChatHistory = async (req, res, next) => {
  try {
    const userId = req.authenticatedUserId || req.patientId || req.user?.id;
    if (!userId || !mongoose.isObjectIdOrHexString(userId)) {
      return next(new AppError("Authentication required", 401));
    }

    await ChatLog.deleteMany({ userId });

    res.json({
      success: true,
      message: "Chat history cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};

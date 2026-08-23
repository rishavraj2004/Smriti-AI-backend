import mongoose from "mongoose";
import ChatLog from "../models/ChatLog.js";
import Patient from "../models/Patient.js";
import AppError from "../utils/appError.js";
import { getGeminiClient, searchMem0, addMem0 } from "../services/aiClients.js";
import { buildMitrSystemPrompt } from "../config/mitrPrompt.js";

const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

// Rich contextual conversational replies when external quota is exhausted
function getContextualFallback(message, language = "en", patientName = "Friend") {
  const lower = message.toLowerCase();
  const lang = language.toLowerCase();

  if (lang === "as") {
    if (lower.includes("চাহ") || lower.includes("tea") || lower.includes("বাগিচা")) {
      return `অসমৰ সেউজীয়া চাহ বাগিচা আৰু গৰম চাহৰ কাপ সঁচাকৈয়ে অতুলনীয়, ${patientName}! আপোনাৰ পুৰণি চাহ বাগিচাৰ স্মৃতিবোৰ মনত পেলালে কিমান ভাল লাগে নহয়নে?`;
    }
    if (lower.includes("বিহু") || lower.includes("গান") || lower.includes("নাচ")) {
      return `বিহুৰ ঢোল আৰু পেঁপাৰ মাত শুনিলে মন আনন্দৰে ভৰি পৰে! ${patientName}, আপোনাৰ কোনটো বিহু আটাইতকৈ প্ৰিয়?`;
    }
    if (lower.includes("কাজিৰঙা") || lower.includes("গঁড়") || lower.includes("প্ৰকৃতি")) {
      return `কাজিৰঙাৰ সেউজীয়া বননি আৰু এশিঙীয়া গঁড় আমাৰ গৌৰৱ! প্ৰকৃতিৰ মাজত থাকিলে মন সদায় শান্ত আৰু সুস্থ হৈ থাকে।`;
    }
    if (lower.includes("নমস্কাৰ") || lower.includes("hello") || lower.includes("hi")) {
      return `নমস্কাৰ ${patientName}! মই আপোনাৰ বন্ধু মিত্ৰ। আজি আপোনাৰ মন আৰু স্বাস্থ্য কেনে আছে?`;
    }
    return `মই আপোনাৰ লগত আছোঁ, ${patientName}। আপোনাৰ কথা শুনি মোৰ বৰ ভাল লাগিছে। মনত কিবা পুৰণি কথা থাকিলে মোক কওক।`;
  }

  if (lang === "hi") {
    if (lower.includes("चाय") || lower.includes("tea") || lower.includes("याद")) {
      return `असम के चाय बागानों की खुशबू और गर्म चाय की चुस्की मन को ताजगी देती है, ${patientName}! पुरानी सुखद यादें हमेशा दिल को खुशी देती हैं।`;
    }
    if (lower.includes("नमस्ते") || lower.includes("hello") || lower.includes("hi")) {
      return `नमस्ते ${patientName} जी! मैं आपका मित्र हूँ। आज आपका दिन कैसा बीत रहा है?`;
    }
    if (lower.includes("दिनचर्या") || lower.includes("सुबह") || lower.includes("दवा")) {
      return `समय पर हल्का भोजन, पर्याप्त पानी और नियमित दिनचर्या बहुत महत्वपूर्ण है, ${patientName} जी। क्या आपने आज सुबह का नाश्ता कर लिया?`;
    }
    return `मैं हमेशा आपकी मदद और बातचीत के लिए यहाँ हूँ, ${patientName} जी। आपका मन कैसा महसूस कर रहा है?`;
  }

  if (lang === "bn") {
    if (lower.includes("চা") || lower.includes("স্মৃতি") || lower.includes("গান")) {
      return `সুন্দর স্মৃতি আর এক কাপ গরম চা মনকে শান্ত করে দেয়, ${patientName}! আপনার পছন্দের কথা শুনতে আমার খুব ভালো লাগছে।`;
    }
    return `নমস্কার ${patientName}! আমি আপনার বন্ধু মিত্র। আপনার সাথে কথা বলতে পেরে আমি খুব খুশি।`;
  }

  // English fallback
  if (lower.includes("tea") || lower.includes("garden") || lower.includes("nature")) {
    return `The lush tea gardens of Assam and fresh morning mist are truly calming, ${patientName}! Reminiscing about peaceful places brings so much warmth.`;
  }
  if (lower.includes("routine") || lower.includes("morning") || lower.includes("start")) {
    return `A gentle morning stretch, a warm drink, and regular routine keep both mind and body energized, ${patientName}. Have you had some water or breakfast today?`;
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("how are you")) {
    return `Hello ${patientName}! I am Mitr, your companion. I am feeling wonderful, thank you! How are you feeling today?`;
  }

  return `I am right here with you, ${patientName}. It is always a pleasure listening to your thoughts and sharing warm moments together.`;
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

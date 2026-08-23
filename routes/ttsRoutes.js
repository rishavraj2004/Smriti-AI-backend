import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let ttsClient = null;
try {
  ttsClient = new TextToSpeechClient({
    keyFilename: path.join(__dirname, "../credentials.json"),
  });
} catch (err) {
  console.warn("Google Cloud TTS client initialization warning:", err.message);
}

router.post("/synthesize", async (req, res, next) => {
  try {
    const { text, languageCode = "en-IN", language } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    if (!ttsClient) {
      return res.status(503).json({
        success: false,
        message: "Google Cloud Text-to-Speech is not initialized",
      });
    }

    let targetLocale = languageCode || "en-IN";
    const lang = (language || "").toLowerCase();

    if (lang === "as" || targetLocale.startsWith("as")) {
      targetLocale = "bn-IN"; // Bengali neural voice sounds natural for Assamese text
    } else if (lang === "hi" || targetLocale.startsWith("hi")) {
      targetLocale = "hi-IN";
    } else if (lang === "bn" || targetLocale.startsWith("bn")) {
      targetLocale = "bn-IN";
    } else if (lang === "mn" || targetLocale.startsWith("mn")) {
      targetLocale = "hi-IN";
    } else if (lang === "mz" || targetLocale.startsWith("mz")) {
      targetLocale = "en-IN";
    } else if (lang === "en" || targetLocale.startsWith("en")) {
      targetLocale = "en-IN";
    }

    const request = {
      input: { text: text.trim() },
      voice: {
        languageCode: targetLocale,
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.88,
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);

    res.json({
      success: true,
      languageCode: targetLocale,
      audioContent: response.audioContent.toString("base64"),
    });
  } catch (err) {
    console.error("TTS Synthesize Error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";
import connectDB from "./config/db.js";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

dotenv.config();

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ttsClient = new TextToSpeechClient({
    keyFilename: path.join(__dirname, "credentials.json"),
});

await connectDB();

const port = process.env.PORT || 4000;

app.post("/api/tts/synthesize", async (req, res) => {
    try {
        const { text, languageCode = "hi-IN" } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: "Text is required",
            });
        }

        // Assamese doesn't have the desired Google voice in this setup,
        // so fall back to Bengali.
        let targetLocale = languageCode;

        if (languageCode.startsWith("as")) {
            targetLocale = "bn-IN";
        }

        const request = {
            input: {
                text,
            },
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
            audioContent: response.audioContent.toString("base64"),
        });
    } catch (err) {
        console.error("TTS Error:", err);

        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

app.listen(port, () => {
    console.log(`App is running on Port ${port}`);
});
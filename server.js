import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

dotenv.config();

const client = new TextToSpeechClient();

await connectDB();

const port = process.env.PORT || 4000;

app.post("/api/tts/synthesize", async (req, res) => {
    try {
        const { text, languageCode = "as-IN" } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        const [response] = await client.synthesizeSpeech({
            input: { text },
            voice: {
                languageCode,
                ssmlGender: "FEMALE",
            },
            audioConfig: {
                audioEncoding: "MP3",
                speakingRate: 0.88,
            },
        });

        res.json({
            audioContent: response.audioContent.toString("base64"),
        });
    } catch (err) {
        console.error("TTS Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`App is running on Port ${port}`);
});
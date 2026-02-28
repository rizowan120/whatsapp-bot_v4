import axios from "axios";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TTS_MODEL = process.env.TTS_MODEL || "canopylabs/orpheus-v1-english";
const TTS_VOICE = process.env.TTS_VOICE || "tara";

/**
 * Convert text to speech using Groq's Orpheus TTS API.
 * @param {string} text - The text to convert to speech
 * @returns {Promise<Buffer>} The WAV audio as a buffer
 */
export async function textToSpeech(text) {
    // Clean text for speech: remove formatting, emojis, and special chars
    const cleanText = text
        .replace(/[*_~`#]/g, "")           // Remove markdown formatting
        .replace(/\n{2,}/g, ". ")          // Double newlines → pause
        .replace(/\n/g, " ")              // Single newlines → space
        .replace(/[•◦▎─]+/g, "")          // Remove list/quote markers
        .replace(/\s{2,}/g, " ")          // Collapse multiple spaces
        .trim();

    if (!cleanText) {
        throw new Error("No text to convert to speech");
    }

    // Truncate to avoid very long audio (Groq has input limits)
    const maxChars = 4000;
    const finalText = cleanText.length > maxChars
        ? cleanText.slice(0, maxChars) + "..."
        : cleanText;

    const response = await axios.post(
        "https://api.groq.com/openai/v1/audio/speech",
        {
            model: TTS_MODEL,
            input: finalText,
            voice: TTS_VOICE,
            response_format: "wav"
        },
        {
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            responseType: "arraybuffer",
            timeout: 60000
        }
    );

    return Buffer.from(response.data);
}

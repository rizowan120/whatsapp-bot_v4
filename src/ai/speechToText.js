import axios from "axios";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const STT_MODEL = process.env.STT_MODEL || "whisper-large-v3";

/**
 * Transcribe audio to text using Groq's Whisper API.
 * @param {Buffer} audioBuffer - The audio data (ogg/opus from WhatsApp)
 * @param {string} [mimeType] - MIME type of the audio
 * @returns {Promise<string>} The transcribed text
 */
export async function transcribeAudio(audioBuffer, mimeType = "audio/ogg") {
    const ext = mimeType.includes("ogg") ? "ogg"
        : mimeType.includes("mp4") ? "m4a"
            : mimeType.includes("mpeg") ? "mp3"
                : "ogg";

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append("file", blob, `audio.${ext}`);
    formData.append("model", STT_MODEL);
    formData.append("response_format", "json");

    const response = await axios.post(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        formData,
        {
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            timeout: 60000
        }
    );

    return response.data.text || "";
}

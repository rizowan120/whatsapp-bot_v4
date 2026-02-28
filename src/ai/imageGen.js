import axios from "axios";

const HF_API_KEY = process.env.HF_API_KEY;
const IMAGE_MODEL = process.env.IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";

/**
 * Generate an image from a text prompt using Hugging Face Inference API.
 * @param {string} prompt - Text description of the image to generate
 * @returns {Promise<Buffer>} The generated image as a buffer
 */
export async function generateImage(prompt) {
    if (!HF_API_KEY) {
        throw new Error("HF_API_KEY is not set. Get one at https://huggingface.co/settings/tokens");
    }

    try {
        const response = await axios.post(
            `https://router.huggingface.co/hf-inference/models/${IMAGE_MODEL}`,
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${HF_API_KEY}`,
                    "Content-Type": "application/json",
                    Accept: "image/jpeg"
                },
                responseType: "arraybuffer",
                timeout: 120000
            }
        );

        const buffer = Buffer.from(response.data);

        // Check if response is actually an error message (JSON) instead of an image
        if (buffer.length < 1000) {
            const text = buffer.toString("utf-8");
            if (text.startsWith("{")) {
                const errorData = JSON.parse(text);
                throw new Error(errorData.error || "Unknown HF API error");
            }
        }

        return buffer;
    } catch (err) {
        // Log full error details for debugging
        if (err.response) {
            const body = err.response.data instanceof Buffer
                ? err.response.data.toString("utf-8").slice(0, 500)
                : JSON.stringify(err.response.data).slice(0, 500);
            console.error(`HF API error [${err.response.status}]:`, body);
        }
        throw err;
    }
}

import { openai } from "../openai.js";

const VISION_MODEL = process.env.VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

/**
 * Process an image using the vision model.
 * Returns a detailed text description of the image.
 *
 * @param {string} base64Image - Base64-encoded image data URL (e.g. "data:image/jpeg;base64,...")
 * @param {string} [caption] - Optional caption/question from the user
 * @returns {Promise<string>} Text description of the image
 */
export async function processImage(base64Image, caption) {

    const userContent = [
        {
            type: "image_url",
            image_url: { url: base64Image }
        }
    ];

    const prompt = caption
        ? `The user sent this image with the message: "${caption}". Describe the image in detail and address their message.`
        : "Describe this image in detail. Include what you see, any text, objects, people, colors, and context.";

    userContent.push({ type: "text", text: prompt });

    const response = await openai.chat.completions.create({
        model: VISION_MODEL,
        messages: [
            {
                role: "system",
                content: "You are a vision assistant. Describe images accurately and in detail. Your description will be used by another AI to generate a response for the user, so be thorough but concise."
            },
            {
                role: "user",
                content: userContent
            }
        ],
        max_tokens: 1024
    });

    return response.choices[0].message.content;
}

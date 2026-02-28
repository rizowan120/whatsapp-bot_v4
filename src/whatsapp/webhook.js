import { processAI } from "../ai/chatEngine.js";
import { processImage } from "../ai/vision.js";
import { extractText, checkFileSize } from "../ai/fileProcessor.js";
import { sendWhatsApp, sendInteractiveList, sendTypingIndicator, sendWhatsAppImage, sendWhatsAppAudio } from "./sender.js";
import { downloadMediaAsBase64, downloadMediaAsBuffer } from "./media.js";
import { MODELS } from "../models.js";
import { setUserModel } from "../ai/memory.js";
import { splitMessage } from "../utils/splitter.js";
import { formatForWhatsApp } from "../utils/formatter.js";
import { rateLimit } from "../utils/rateLimiter.js";
import { generateImage } from "../ai/imageGen.js";
import { transcribeAudio } from "../ai/speechToText.js";
import { textToSpeech } from "../ai/textToSpeech.js";

export async function handleWebhook(req, res) {

  if (req.method === "GET") {
    if (
      req.query["hub.verify_token"] === process.env.VERIFY_TOKEN
    )
      return res.send(req.query["hub.challenge"]);

    return res.sendStatus(403);
  }

  const msg =
    req.body.entry?.[0]?.changes?.[0]
      ?.value?.messages?.[0];

  if (!msg) return res.sendStatus(200);

  const user = msg.from;

  if (!rateLimit(user))
    return res.sendStatus(200);

  // Determine message type and extract content
  const text = msg.text?.body;
  const image = msg.image;
  const document = msg.document;
  const interactive = msg.interactive;
  const audio = msg.audio;

  // Skip if no supported content
  if (!text && !image && !document && !interactive && !audio)
    return res.sendStatus(200);

  res.sendStatus(200);

  // Show typing indicator ("..." bubble) while processing
  await sendTypingIndicator(user, msg.id);

  try {
    // --- Interactive list reply (model selection) ---
    if (interactive && interactive.type === "list_reply") {
      const selectedModelKey = interactive.list_reply.id;
      const model = MODELS[selectedModelKey];

      if (model) {
        setUserModel(user, selectedModelKey);
        await sendWhatsApp(user, `✅ Model changed to ${model.name}.`);
      }
      return;
    }

    // --- /imagine command → generate image ---
    if (text && text.startsWith("/imagine")) {
      const prompt = text.slice("/imagine".length).trim();
      if (!prompt) {
        await sendWhatsApp(user, "✏️ Please provide a prompt.\nExample: /imagine a cat wearing sunglasses");
        return;
      }

      try {
        const imageBuffer = await generateImage(prompt);
        await sendWhatsAppImage(user, imageBuffer, `🎨 ${prompt}`);
      } catch (err) {
        console.error("Image generation failed:", err.message);
        await sendWhatsApp(user, "⚠️ Image generation failed. Please try again later.");
      }
      return;
    }

    // --- /models command → send interactive list ---
    if (text === "/models") {
      const rows = Object.entries(MODELS).map(([key, model]) => ({
        id: key,
        title: model.name,
        description: model.id
      }));

      await sendInteractiveList(
        user,
        "Choose your preferred AI model from the list below.",
        "Select Model",
        rows,
        "🤖 Available Models"
      );
      return;
    }

    // --- /model NAME command (kept as fallback) ---
    if (text && text.startsWith("/model")) {
      const m = text.split(" ")[1];
      if (MODELS[m]) {
        setUserModel(user, m);
        await sendWhatsApp(user, `✅ Model changed to ${MODELS[m].name}.`);
      } else {
        const available = Object.keys(MODELS).join(", ");
        await sendWhatsApp(user, `❌ Model "${m || ""}" not found.\nAvailable: ${available}\n\nOr type /models to select from a list.`);
      }
      return;
    }

    // --- Voice message processing (STT → AI → TTS) ---
    if (audio) {
      const audioBuffer = await downloadMediaAsBuffer(audio.id);
      const transcript = await transcribeAudio(audioBuffer, audio.mime_type || "audio/ogg");

      if (!transcript || !transcript.trim()) {
        await sendWhatsApp(user, "⚠️ I couldn't understand the audio. Please try again.");
        return;
      }

      // Process transcript through AI
      let reply = await processAI(user, transcript);
      reply = formatForWhatsApp(reply);

      // Send text reply first (for readability)
      for (const part of splitMessage(reply)) {
        await sendWhatsApp(user, part);
      }

      // Send voice reply
      try {
        const voiceBuffer = await textToSpeech(reply);
        await sendWhatsAppAudio(user, voiceBuffer);
      } catch (ttsErr) {
        console.error("TTS failed:", ttsErr.message);
        // Text reply already sent, so just log the TTS failure
      }
      return;
    }

    // --- Image processing (two-stage pipeline) ---
    if (image) {
      const caption = image.caption || "";

      const base64Image = await downloadMediaAsBase64(
        image.id,
        image.mime_type || "image/jpeg"
      );
      const imageDescription = await processImage(base64Image, caption);

      const contextPrompt = caption
        ? `[The user sent an image with the message: "${caption}"]\n\nImage description: ${imageDescription}\n\nRespond to the user's message based on the image description above. Do not mention that you received an image description — respond naturally as if you can see the image.`
        : `[The user sent an image]\n\nImage description: ${imageDescription}\n\nRespond naturally about this image. Do not mention that you received an image description — respond as if you can see the image.`;

      let reply = await processAI(user, contextPrompt);
      reply = formatForWhatsApp(reply);

      for (const part of splitMessage(reply)) {
        await sendWhatsApp(user, part);
      }
      return;
    }

    // --- Document processing (PDF, DOCX, code files) ---
    if (document) {
      const caption = document.caption || "";
      const filename = document.filename || "unknown";
      const mimeType = document.mime_type || "application/octet-stream";

      const buffer = await downloadMediaAsBuffer(document.id);

      const sizeCheck = checkFileSize(buffer);
      if (!sizeCheck.ok) {
        await sendWhatsApp(user, sizeCheck.message);
        return;
      }

      const result = await extractText(buffer, mimeType, filename);

      if (result.error) {
        await sendWhatsApp(user, result.error);
        return;
      }

      const contextPrompt = caption
        ? `[The user sent a ${result.type} file named "${filename}" with the message: "${caption}"]\n\nFile content:\n${result.text}\n\nRespond to the user's message based on the file content above.`
        : `[The user sent a ${result.type} file named "${filename}"]\n\nFile content:\n${result.text}\n\nAnalyze this file and provide a helpful summary or response. Mention key points, structure, or anything noteworthy about the content.`;

      let reply = await processAI(user, contextPrompt);
      reply = formatForWhatsApp(reply);

      for (const part of splitMessage(reply)) {
        await sendWhatsApp(user, part);
      }
      return;
    }

    // --- Normal text processing ---
    let reply = await processAI(user, text);
    reply = formatForWhatsApp(reply);

    for (const part of splitMessage(reply)) {
      await sendWhatsApp(user, part);
    }
  } catch (err) {
    console.error("Error handling message:", err);
    try {
      await sendWhatsApp(user, "⚠️ Something went wrong. Please try again.");
    } catch (_) {
      // If even the error message fails to send, just log it
    }
  }
}

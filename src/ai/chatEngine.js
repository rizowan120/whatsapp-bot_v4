import { openai } from "../openai.js";
import { MODELS } from "../models.js";
import { getSession, getUserModel } from "./memory.js";

const SUMMARIZE_MODEL = process.env.SUMMARIZE_MODEL || "llama-3.3-70b-versatile";

async function summarize(session) {

  const text = session.messages
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  try {
    const res = await openai.chat.completions.create({
      model: SUMMARIZE_MODEL,
      messages: [
        { role: "system", content: "Summarize briefly." },
        { role: "user", content: text }
      ]
    });

    session.summary =
      res.choices[0].message.content;
  } catch (err) {
    console.error("Summarization failed:", err.message);
    // Keep existing summary if summarization fails
  }

  session.messages = session.messages.slice(-8);
}

export async function processAI(user, text) {

  const session = getSession(user);

  session.messages.push({ role: "user", content: text });

  if (session.messages.length > 20)
    await summarize(session);

  const modelKey = getUserModel(user);
  const model = MODELS[modelKey];

  const messages = [
    { role: "system", content: model.systemPrompt },
    ...(session.summary
      ? [{ role: "system", content: "Summary: " + session.summary }]
      : []),
    ...session.messages.slice(-8)
  ];

  const response =
    await openai.chat.completions.create({
      model: model.id,
      messages
    });

  const reply =
    response.choices[0].message.content;

  session.messages.push({
    role: "assistant",
    content: reply
  });

  return reply;
}

export function formatForWhatsApp(text) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(\w+)/g, "```")
    .replace(/^#{1,6}\s/gm, "")
    .trim();
}

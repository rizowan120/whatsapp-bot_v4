/**
 * Convert AI-generated Markdown into WhatsApp-compatible formatting.
 *
 * WhatsApp supports:
 *   *bold*      _italic_      ~strikethrough~      ```monospace```
 *
 * This formatter handles:
 *   - <think> blocks (reasoning model output)
 *   - Headers → bold lines
 *   - Bold / italic / strikethrough conversion
 *   - Links → text (url)
 *   - Images → [image: alt]
 *   - Inline code preserved
 *   - Code blocks (keep triple-backtick, strip language tag)
 *   - Bullet and numbered lists with proper symbols
 *   - Horizontal rules → visual separator
 *   - Tables → aligned plain-text
 *   - HTML tags removal
 *   - Cleanup of excessive blank lines
 */

export function formatForWhatsApp(text) {
  if (!text) return "";

  let result = text;

  // ── 1. Strip <think>...</think> blocks (reasoning models) ──
  result = result.replace(/<think>[\s\S]*?<\/think>/gi, "");

  // ── 2. Convert Markdown tables to plain-text ──
  result = convertTables(result);

  // ── 3. Protect code blocks from formatting ──
  //    Extract them, replace with placeholders, restore at the end.
  const protected_ = [];

  // Multi-line code blocks: parse line by line to handle backticks inside code
  result = extractCodeBlocks(result, protected_);

  // Inline code: `code`
  result = result.replace(/`([^`\n]+)`/g, (match) => {
    protected_.push(match);
    return `\x00PROTECTED${protected_.length - 1}\x00`;
  });

  // ── 4. Headers → *bold* ──
  result = result.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");

  // ── 5. Images: ![alt](url) → [image: alt] ──
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt) => {
    return alt ? `[image: ${alt}]` : "[image]";
  });

  // ── 6. Links: [text](url) → text (url) ──
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

  // ── 7. Bold + Italic: ***text*** or ___text___ → *_text_* ──
  result = result.replace(/\*{3}(.+?)\*{3}/g, "*_$1_*");
  result = result.replace(/_{3}(.+?)_{3}/g, "*_$1_*");

  // ── 8. Bold: **text** → *text*  (WhatsApp uses single * for bold) ──
  result = result.replace(/\*{2}(.+?)\*{2}/g, "*$1*");
  result = result.replace(/_{2}(.+?)_{2}/g, "*$1*");

  // ── 9. Italic: _text_ stays as _text_ (WhatsApp native) ──
  //    Single *text* (not already bold) → _text_
  //    This is tricky — after step 8, all bold is single *.
  //    So remaining single * that were originally italic *text* need conversion.
  //    We skip this to avoid conflicts. AI models mostly use ** for bold and _ for italic.

  // ── 10. Strikethrough: ~~text~~ → ~text~ ──
  result = result.replace(/~~(.+?)~~/g, "~$1~");

  // ── 11. Horizontal rules → separator ──
  result = result.replace(/^\s*([-*_]){3,}\s*$/gm, "─────────────────");

  // ── 12. Blockquotes: > text → ▎ text ──
  result = result.replace(/^>\s?/gm, "▎ ");

  // ── 13. Unordered lists: -, *, + → • ──
  result = result.replace(/^(\s*)[-*+]\s+/gm, (_, indent) => {
    const level = Math.floor((indent || "").length / 2);
    return level === 0 ? "• " : "  ".repeat(level) + "◦ ";
  });

  // ── 14. Strip remaining HTML tags ──
  result = result.replace(/<\/?[^>]+(>|$)/g, "");

  // ── 15. Restore protected blocks ──
  result = result.replace(/\x00PROTECTED(\d+)\x00/g, (_, i) => protected_[parseInt(i)]);

  // ── 16. Clean up excessive blank lines (max 2 consecutive) ──
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}


/**
 * Convert Markdown tables to plain-text for WhatsApp.
 *
 * | Name  | Age |         *Name* | *Age*
 * |-------|-----|   →      Alice | 30
 * | Alice | 30  |          Bob   | 25
 * | Bob   | 25  |
 */
function convertTables(text) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Check for table: row line followed by separator line
    if (
      isTableRow(line) &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1].trim())
    ) {
      // Header → bold each cell
      const header = parseCells(line);
      out.push(header.map((c) => `*${c}*`).join(" | "));

      i += 2; // skip header + separator

      // Data rows
      while (i < lines.length && isTableRow(lines[i].trim())) {
        out.push(parseCells(lines[i].trim()).join(" | "));
        i++;
      }
      out.push(""); // blank line after table
    } else {
      out.push(lines[i]);
      i++;
    }
  }

  return out.join("\n");
}

function isTableRow(line) {
  return /^\|(.+)\|$/.test(line);
}

function isTableSeparator(line) {
  return /^\|[\s:]*-+[\s:]*(\|[\s:]*-+[\s:]*)*\|$/.test(line);
}

function parseCells(row) {
  return row
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

/**
 * Extract code blocks line by line and replace them with placeholders.
 * Handles code containing backticks, template literals, etc.
 */
function extractCodeBlocks(text, protected_) {
  const lines = text.split("\n");
  const out = [];
  let inBlock = false;
  let blockLines = [];

  for (const line of lines) {
    if (!inBlock && /^```/.test(line.trim())) {
      // Start of code block — begin collecting
      inBlock = true;
      blockLines = [];
    } else if (inBlock && /^```\s*$/.test(line.trim())) {
      // End of code block
      inBlock = false;
      const code = blockLines.join("\n");
      protected_.push("```\n" + code + "\n```");
      out.push(`\x00PROTECTED${protected_.length - 1}\x00`);
      blockLines = [];
    } else if (inBlock) {
      blockLines.push(line);
    } else {
      out.push(line);
    }
  }

  // If unclosed code block, output remaining lines as-is
  if (inBlock) {
    out.push("```");
    out.push(...blockLines);
  }

  return out.join("\n");
}

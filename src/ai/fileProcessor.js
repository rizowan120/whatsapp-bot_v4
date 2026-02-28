// Polyfill browser-only DOM classes for pdfjs-dist (used by pdf-parse v2).
// These are required on Termux/Node.js environments without canvas support.
// Only text extraction is used, so empty stubs are safe.
if (typeof globalThis.DOMMatrix === "undefined") {
    globalThis.DOMMatrix = class DOMMatrix {
        constructor() { this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0; }
    };
}
if (typeof globalThis.Path2D === "undefined") {
    globalThis.Path2D = class Path2D { };
}
if (typeof globalThis.ImageData === "undefined") {
    globalThis.ImageData = class ImageData { constructor(w, h) { this.width = w; this.height = h; } };
}

import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import path from "path";

// Configurable limits
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || "10") * 1024 * 1024;
const MAX_TEXT_LENGTH = parseInt(process.env.MAX_TEXT_LENGTH || "15000");

// MIME types and extensions that are treated as plain text (code / text files)
const TEXT_MIME_TYPES = new Set([
    "text/plain", "text/csv", "text/html", "text/css", "text/xml",
    "text/markdown", "text/x-python", "text/x-java", "text/x-c",
    "text/javascript", "application/json", "application/xml",
    "application/x-yaml", "application/x-sh",
]);

const TEXT_EXTENSIONS = new Set([
    ".txt", ".csv", ".md", ".json", ".xml", ".yaml", ".yml",
    ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
    ".py", ".java", ".c", ".cpp", ".h", ".hpp", ".cs",
    ".go", ".rs", ".rb", ".php", ".swift", ".kt",
    ".html", ".css", ".scss", ".sass", ".less",
    ".sh", ".bash", ".zsh", ".bat", ".ps1",
    ".sql", ".r", ".lua", ".dart", ".vue", ".svelte",
    ".toml", ".ini", ".cfg", ".env", ".gitignore",
    ".dockerfile", ".makefile",
]);

/**
 * Check if a file exceeds the size limit.
 * @param {Buffer} buffer - the file buffer
 * @returns {{ ok: boolean, message?: string }}
 */
export function checkFileSize(buffer) {
    if (buffer.length > MAX_FILE_SIZE) {
        const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);
        const limitMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
        return { ok: false, message: `⚠️ File too large (${sizeMB} MB). Maximum is ${limitMB} MB.` };
    }
    return { ok: true };
}

/**
 * Determine if the file is a text/code file based on MIME type or extension.
 */
function isTextFile(mimeType, filename) {
    if (TEXT_MIME_TYPES.has(mimeType)) return true;
    const ext = path.extname(filename || "").toLowerCase();
    return TEXT_EXTENSIONS.has(ext);
}

/**
 * Truncate text if it exceeds the configured limit.
 */
function truncateText(text, filename) {
    if (text.length <= MAX_TEXT_LENGTH) return text;

    const truncated = text.slice(0, MAX_TEXT_LENGTH);
    return truncated + `\n\n... (truncated — showing ${MAX_TEXT_LENGTH.toLocaleString()} of ${text.length.toLocaleString()} characters from "${filename}")`;
}

/**
 * Extract text content from a file buffer.
 * Supports PDF, DOCX, and plain text/code files.
 *
 * @param {Buffer} buffer - File content
 * @param {string} mimeType - MIME type from WhatsApp
 * @param {string} filename - Original filename
 * @returns {Promise<{ text: string, type: string } | { error: string }>}
 */
export async function extractText(buffer, mimeType, filename) {

    try {
        // PDF
        if (mimeType === "application/pdf") {
            const parser = new PDFParse({ data: buffer });
            const result = await parser.getText();
            const text = truncateText(result.text.trim(), filename);
            return { text, type: "PDF" };
        }

        // DOCX
        if (
            mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            mimeType === "application/msword"
        ) {
            const result = await mammoth.extractRawText({ buffer });
            const text = truncateText(result.value.trim(), filename);
            return { text, type: "DOCX" };
        }

        // Plain text / code files
        if (isTextFile(mimeType, filename)) {
            const ext = path.extname(filename || "").replace(".", "").toUpperCase() || "TEXT";
            const text = truncateText(buffer.toString("utf-8").trim(), filename);
            return { text, type: ext };
        }

        return { error: `❌ Unsupported file type: ${mimeType || "unknown"}` };
    } catch (err) {
        console.error("File extraction failed:", err.message);
        return { error: "⚠️ Failed to read this file. It may be corrupted or in an unsupported format." };
    }
}

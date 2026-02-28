import axios from "axios";

const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v20.0";

/**
 * Get the download URL for a WhatsApp media ID.
 * @param {string} mediaId - The media ID from the webhook payload
 * @returns {Promise<string>} The download URL
 */
async function getMediaUrl(mediaId) {
    const res = await axios.get(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
            }
        }
    );
    return res.data.url;
}

/**
 * Download a WhatsApp media file and return it as a base64 data URL.
 * Used for images (vision model needs base64).
 * @param {string} mediaId
 * @param {string} [mimeType="image/jpeg"]
 * @returns {Promise<string>} Base64-encoded data URL
 */
export async function downloadMediaAsBase64(mediaId, mimeType = "image/jpeg") {
    const url = await getMediaUrl(mediaId);

    const res = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
        }
    });

    const base64 = Buffer.from(res.data).toString("base64");
    return `data:${mimeType};base64,${base64}`;
}

/**
 * Download a WhatsApp media file and return it as a raw Buffer.
 * Used for documents (PDF, DOCX, code files).
 * @param {string} mediaId
 * @returns {Promise<Buffer>} Raw file buffer
 */
export async function downloadMediaAsBuffer(mediaId) {
    const url = await getMediaUrl(mediaId);

    const res = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
        }
    });

    return Buffer.from(res.data);
}

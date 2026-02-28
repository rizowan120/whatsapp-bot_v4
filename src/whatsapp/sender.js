import axios from "axios";

const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v20.0";

function getApiUrl() {
  return `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.PHONE_NUMBER_ID}/messages`;
}

function getHeaders() {
  return { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` };
}

export async function sendWhatsApp(to, text) {
  try {
    await axios.post(
      getApiUrl(),
      {
        messaging_product: "whatsapp",
        to,
        text: { body: text }
      },
      { headers: getHeaders() }
    );
  } catch (err) {
    console.error("Failed to send WhatsApp message:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * Send an interactive list message (tap-to-select popup).
 * @param {string} to - Recipient phone number
 * @param {string} bodyText - Message body text
 * @param {string} buttonText - Text on the button that opens the list
 * @param {Array<{id: string, title: string, description?: string}>} rows - List items
 * @param {string} [headerText] - Optional header text
 */
export async function sendInteractiveList(to, bodyText, buttonText, rows, headerText) {
  try {
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: bodyText },
        action: {
          button: buttonText,
          sections: [
            {
              title: "Models",
              rows
            }
          ]
        }
      }
    };

    if (headerText) {
      payload.interactive.header = { type: "text", text: headerText };
    }

    await axios.post(getApiUrl(), payload, { headers: getHeaders() });
  } catch (err) {
    console.error("Failed to send interactive list:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * Show the typing indicator ("..." bubble) to the user.
 * Also marks the incoming message as read (blue ticks).
 * @param {string} to - Recipient phone number
 * @param {string} messageId - The incoming message ID to mark as read
 */
export async function sendTypingIndicator(to, messageId) {
  try {
    await axios.post(
      getApiUrl(),
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
        typing_indicator: { type: "text" }
      },
      { headers: getHeaders() }
    );
  } catch (err) {
    // Non-critical — don't throw, just log
    console.error("Failed to send typing indicator:", err.response?.data || err.message);
  }
}

/**
 * Upload an image buffer to WhatsApp and send it as a message.
 * @param {string} to - Recipient phone number
 * @param {Buffer} imageBuffer - The image data
 * @param {string} [caption] - Optional caption for the image
 */
export async function sendWhatsAppImage(to, imageBuffer, caption) {
  try {
    // Step 1: Upload media to WhatsApp
    const mediaUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.PHONE_NUMBER_ID}/media`;

    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: "image/jpeg" });
    formData.append("file", blob, "generated.jpg");
    formData.append("messaging_product", "whatsapp");
    formData.append("type", "image/jpeg");

    const uploadRes = await axios.post(mediaUrl, formData, {
      headers: {
        ...getHeaders(),
      }
    });

    const mediaId = uploadRes.data.id;

    // Step 2: Send image message using the media ID
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "image",
      image: { id: mediaId }
    };

    if (caption) {
      payload.image.caption = caption;
    }

    await axios.post(getApiUrl(), payload, { headers: getHeaders() });
  } catch (err) {
    console.error("Failed to send WhatsApp image:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * Upload audio and send it as a WhatsApp audio message.
 * @param {string} to - Recipient phone number
 * @param {Buffer} audioBuffer - The audio data (WAV)
 */
export async function sendWhatsAppAudio(to, audioBuffer) {
  try {
    const mediaUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.PHONE_NUMBER_ID}/media`;

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: "audio/wav" });
    formData.append("file", blob, "response.wav");
    formData.append("messaging_product", "whatsapp");
    formData.append("type", "audio/wav");

    const uploadRes = await axios.post(mediaUrl, formData, {
      headers: { ...getHeaders() }
    });

    const mediaId = uploadRes.data.id;

    await axios.post(getApiUrl(), {
      messaging_product: "whatsapp",
      to,
      type: "audio",
      audio: { id: mediaId }
    }, { headers: getHeaders() });
  } catch (err) {
    console.error("Failed to send WhatsApp audio:", err.response?.data || err.message);
    throw err;
  }
}

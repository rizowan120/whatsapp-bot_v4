import "../config.js";

import express from "express";
import { handleWebhook } from "./webhook.js";


const app = express();
app.use(express.json());

app.get("/webhook", handleWebhook);
app.post("/webhook", handleWebhook);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`WhatsApp AI bot running on port ${PORT} 🚀`)
);

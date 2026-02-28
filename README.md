# 🤖 ObsidianAI — WhatsApp AI Bot

A powerful, multi-model WhatsApp AI chatbot powered by **Groq** and **Hugging Face**. Chat naturally, analyze images, process documents, generate images — all from WhatsApp.

---

## ✨ Features

| Feature | Description |
|---|---|
| 💬 **Multi-Model Chat** | Switch between 7 AI models (LLaMA, DeepSeek, Mixtral, Qwen, Kimi K2, GPT-OSS) |
| 🖼️ **Image Understanding** | Send an image and the bot describes & discusses it naturally |
| 📄 **File Processing** | Upload PDFs, DOCX, or code files — the bot reads and analyzes them |
| 🎨 **Image Generation** | Generate images from text prompts using FLUX.1 via Hugging Face |
| 🧠 **Conversation Memory** | Remembers context with automatic summarization for long chats |
| ⌨️ **Typing Indicator** | Shows "..." while processing, plus blue tick read receipts |
| 📋 **Interactive Model Picker** | Tap-to-select model list (no need to type model names) |
| 🛡️ **Rate Limiting** | Built-in protection against spam |
| 📏 **File Size Limits** | Configurable max file size (10 MB) and text length (15K chars) |

---

## 🗂️ Project Structure

```
whatsapp-bot/
├── src/
│   ├── ai/
│   │   ├── chatEngine.js      # Core AI logic, memory & summarization
│   │   ├── fileProcessor.js   # PDF, DOCX & code file text extraction
│   │   ├── imageGen.js        # Image generation via Hugging Face
│   │   ├── memory.js          # Per-user model & session storage
│   │   └── vision.js          # Image understanding via vision model
│   ├── whatsapp/
│   │   ├── media.js           # Download media from WhatsApp API
│   │   ├── sender.js          # Send text, images & interactive lists
│   │   ├── server.js          # Express server entry point
│   │   └── webhook.js         # Webhook handler (routes all messages)
│   ├── utils/
│   │   ├── formatter.js       # Format AI output for WhatsApp
│   │   ├── rateLimiter.js     # Rate limiting per user
│   │   └── splitter.js        # Split long messages
│   ├── config.js              # Environment config loader
│   ├── models.js              # AI model definitions & system prompts
│   └── openai.js              # Groq API client (OpenAI-compatible)
├── .env.example               # Environment variable template
├── package.json
└── README.md
```

---

## 🤖 Available Models

| Command Key | Model | Provider |
|---|---|---|
| `llama-3.3-70b` | LLaMA 3.3 70B *(default)* | Groq |
| `deepseek` | DeepSeek R1 Distill Qwen 32B | Groq |
| `llama` | LLaMA 3.3 70B | Groq |
| `mistral` | Mixtral 8x7B | Groq |
| `gpt-oss-120b` | GPT-OSS 120B | Groq |
| `kimi-k2` | Kimi K2 Instruct | Groq |
| `qwen3-32b` | Qwen 3 32B | Groq |

---

## 💬 Bot Commands

| Command | Action |
|---|---|
| `/models` | Shows interactive model picker (tap to select) |
| `/model <name>` | Switch model by typing the name |
| `/imagine <prompt>` | Generate an image from a text description |
| *Send an image* | Bot analyzes and discusses the image |
| *Send a PDF/DOCX/code file* | Bot reads and analyzes the file content |
| *Send any text* | Normal AI chat |

---

## 📋 Prerequisites

Before setting up the bot, you need:

1. **Meta Developer Account** — [developers.facebook.com](https://developers.facebook.com)
2. **WhatsApp Business API App** — Create an app with WhatsApp product
3. **Groq API Key** — [console.groq.com](https://console.groq.com) (free)
4. **Hugging Face API Key** — [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) (free, for image generation)
5. **Cloudflared** — For tunneling localhost to a public URL

### Getting WhatsApp API Credentials

1. Go to [Meta for Developers](https://developers.facebook.com) → Create App → Select **Business** type
2. Add **WhatsApp** product to your app
3. In WhatsApp → API Setup, you'll find:
   - **Phone Number ID** — Your test phone number's ID
   - **Temporary Access Token** — Copy this (expires in 24h; generate a permanent one for production)
4. Set up a **Webhook**:
   - URL: Your cloudflare tunnel URL + `/webhook` (e.g., `https://your-tunnel.trycloudflare.com/webhook`)
   - Verify Token: Any string you choose (must match your `.env`)
   - Subscribe to: `messages`

---

## 🔧 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Required
GROQ_API_KEY=gsk_your_groq_api_key
ACCESS_TOKEN=your_whatsapp_access_token
PHONE_NUMBER_ID=your_phone_number_id
VERIFY_TOKEN=your_webhook_verify_token

# Optional (defaults shown)
PORT=3000
GRAPH_API_VERSION=v20.0
SUMMARIZE_MODEL=llama-3.3-70b-versatile
VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
MAX_FILE_SIZE_MB=10
MAX_TEXT_LENGTH=15000

# Image Generation (optional)
HF_API_KEY=hf_your_huggingface_token
IMAGE_MODEL=black-forest-labs/FLUX.1-schnell
```

---

## 🚀 Setup & Installation

### 🐧 Linux (Ubuntu/Debian)

#### 1. Install Node.js
```bash
# Using NodeSource (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v   # Should show v20.x.x
npm -v
```

#### 2. Install Cloudflared
```bash
# Debian/Ubuntu
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared

# Or download binary directly
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

#### 3. Clone & Install
```bash
git clone https://github.com/rizowan120/whatsapp-bot.git
cd whatsapp-bot
npm install
```

#### 4. Configure Environment
```bash
cp .env.example .env
nano .env
# Fill in your API keys and tokens
```

#### 5. Run the Bot
```bash
# Terminal 1: Start the bot
npm start

# Terminal 2: Start the tunnel
cloudflared tunnel --url http://localhost:3000
```

#### 6. Set Webhook URL
Copy the tunnel URL from cloudflared output and set it as your WhatsApp webhook:
```
https://your-random-tunnel.trycloudflare.com/webhook
```

---

### 🪟 Windows

#### 1. Install Node.js
- Download from [nodejs.org](https://nodejs.org) (LTS version)
- Run the installer, check "Add to PATH"
- Open **Command Prompt** or **PowerShell** and verify:
```cmd
node -v
npm -v
```

#### 2. Install Cloudflared
- Download from [Cloudflare Releases](https://github.com/cloudflare/cloudflared/releases/latest)
  - Choose `cloudflared-windows-amd64.exe`
- Rename to `cloudflared.exe` and move to a folder in your PATH (e.g., `C:\Windows\`)
- Or use winget:
```cmd
winget install cloudflare.cloudflared
```

#### 3. Clone & Install
```cmd
git clone https://github.com/rizowan120/whatsapp-bot.git
cd whatsapp-bot
npm install
```

#### 4. Configure Environment
```cmd
copy .env.example .env
notepad .env
```
Fill in your API keys and tokens.

#### 5. Run the Bot
Open **two** Command Prompt/PowerShell windows:

**Window 1 — Bot:**
```cmd
npm start
```

**Window 2 — Tunnel:**
```cmd
cloudflared tunnel --url http://localhost:3000
```

#### 6. Set Webhook URL
Copy the tunnel URL and set it in your Meta Developer Console as described in Prerequisites.

---

### 📱 Termux (Android)

#### 1. Install Termux
- Download from [F-Droid](https://f-droid.org/en/packages/com.termux/) (recommended over Play Store)

#### 2. Install Packages
```bash
pkg update && pkg upgrade -y
pkg install nodejs-lts git cloudflared -y
```

#### 3. Clone & Install
```bash
git clone https://github.com/rizowan120/whatsapp-bot.git
cd whatsapp-bot
npm install
```

#### 4. Configure Environment
```bash
cp .env.example .env
nano .env
# Fill in your API keys and tokens
```

#### 5. Run the Bot (using tmux)
```bash
# Install tmux to run multiple processes
pkg install tmux -y

# Start tmux session
tmux new -s bot

# Start the bot
npm start

# Split the terminal: press Ctrl+B, then %
# In the new pane, start the tunnel:
cloudflared tunnel --url http://localhost:3000

# Detach from tmux: press Ctrl+B, then D
# Reattach later: tmux attach -t bot
```

#### 6. Keep Running in Background
```bash
# Prevent Android from killing Termux
termux-wake-lock

# To stop:
termux-wake-unlock
```

#### 7. Set Webhook URL
Copy the tunnel URL and set it in your Meta Developer Console.

> **⚡ Termux Tips:**
> - Use `termux-wake-lock` to prevent the bot from being killed when you minimize the app
> - Keep the phone plugged in for 24/7 operation
> - For a more reliable setup, consider running on a cloud server

---

## 📄 Supported File Types

### Documents
- 📕 **PDF** — Text extracted via `pdf-parse`
- 📘 **DOCX** — Text extracted via `mammoth`

### Code & Text Files
- **JavaScript/TypeScript:** `.js`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.jsx`
- **Python:** `.py`
- **C/C++:** `.c`, `.cpp`, `.h`, `.hpp`
- **Java/Kotlin:** `.java`, `.kt`
- **Go/Rust:** `.go`, `.rs`
- **Web:** `.html`, `.css`, `.scss`, `.vue`, `.svelte`
- **Data:** `.json`, `.xml`, `.yaml`, `.yml`, `.csv`, `.sql`
- **Shell:** `.sh`, `.bash`, `.bat`, `.ps1`
- **Config:** `.toml`, `.ini`, `.env`, `.gitignore`
- **Others:** `.rb`, `.php`, `.swift`, `.dart`, `.lua`, `.r`, `.md`, `.txt`

### Limits
- **Max file size:** 10 MB (configurable via `MAX_FILE_SIZE_MB`)
- **Max text length:** 15,000 characters (configurable via `MAX_TEXT_LENGTH`)
- Files exceeding the text limit are automatically truncated with a note

---

## 🏗️ Architecture

```
User sends WhatsApp message
        │
        ▼
  ┌─────────────┐
  │   Webhook    │──── /models ──── Interactive List Picker
  │  (webhook.js)│──── /model  ──── Direct Model Switch
  │              │──── /imagine ─── Image Generation (HF API)
  └──────┬───────┘
         │
    ┌────┴────┐
    │  Type?  │
    └────┬────┘
         │
    ┌────┼────────────┐
    │    │             │
  Text  Image      Document
    │    │             │
    ▼    ▼             ▼
processAI  Vision    File Processor
    │    Model        (pdf-parse,
    │    (Llama 4)     mammoth)
    │      │             │
    │      ▼             │
    │   processAI ◄──────┘
    │      │
    ▼      ▼
  Format & Send Reply
```

---

## 🛠️ Development

```bash
# Run with auto-reload on file changes
npm run dev

# Check syntax of all files
node --check src/whatsapp/server.js
```

---

## 📝 License

MIT

---

## 👨‍💻 Author

**Mr. Rizowan Ahmed**

---

> Built with ❤️ using Node.js, Groq, Hugging Face, and the WhatsApp Cloud API

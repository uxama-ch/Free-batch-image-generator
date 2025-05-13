# 🎨 Together AI Image Generator

A powerful, open-source web app for **batch AI image generation** using [Together AI](https://together.ai)'s **FLUX.1-schnell-Free** model.

![image](https://github.com/user-attachments/assets/72a48cf9-d675-41d0-b4f1-ba1707609608)

![image](https://github.com/user-attachments/assets/069da6e2-6b63-49e2-8b42-d02949d5aab4)

![image](https://github.com/user-attachments/assets/90bcadd2-9d58-4bb4-8542-6f0734755ee8)




---

## 📌 Overview

**Together AI Image Generator** allows you to create multiple images from text prompts with ease — ideal for **content creators, designers, and developers**.

Built to handle **rate-limited APIs** smartly, it supports uploading prompt files, managing multiple API keys, advanced image generation settings, and offers a live progress dashboard with a full-featured gallery.

---

## 🚀 How It Works

The app runs in **four simple steps**:

### 🔠 Step 1: Upload Prompts

- **Option 1**: Upload a `.txt` file (one prompt per line)
- **Option 2**: Enter text prompts manually in a text area

✅ Example Prompts:

A beautiful landscape with mountains and a lake
A futuristic city with flying cars
A portrait of a cyberpunk character


---

### 🔐 API Keys

To boost capacity:
- Add multiple Together AI API keys
- Stored **locally in your browser**, never sent to a server

**How to get keys:**
1. Create an account at [Together.ai](https://together.ai/)
2. Go to Dashboard → Developer/API Keys → Generate Key
3. Add your key(s) in the app

💡 **Pro Tip**: Use multiple accounts for more API keys = better concurrency.

---

### ⚙️ Step 2: Settings

#### 🖼️ Image Settings
- **Aspect Ratio**: Square (1:1), Landscape (16:9), Portrait (9:16)
- **Diffusion Steps**: 1 to 4
- **Negative Prompt**: What to avoid in images
- **Seed**: Fixed or random

#### ⚡ Processing Settings
- **Concurrency Level**: Default 2 (safe for rate limits)
- **Automatic Retry**: Toggle on/off
- **Retry Attempts**: Max retry count per image
- **Retry Delay**: Time delay between retries (in seconds)

⚠️ **Rate Limit Warning**:  
The **FLUX.1-schnell-Free** model allows **6 requests/min** globally. Even with multiple keys, we recommend **concurrency ≤ 2**.

---

### 🛠️ Step 3: Generation

Once started, the app processes prompts in batches with smart queuing.

#### 📊 Progress Monitoring:
- Progress bar with completion %  
- Statistics: total, completed, failed, speed (images/min)
- Retry history & API key logs per image

#### ⏯️ Controls:
- Pause / Resume  
- Cancel generation  
- View generation queue with detailed status

---

### 🖼️ Step 4: Gallery

Visualize and manage all your generated images easily.

#### 🧰 Gallery Features:
- View images in a responsive grid
- Click to enlarge any image
- **Download All**: Zip archive
- **Reset Gallery** to start over
- Individual download per image

---

## 🧠 Built-in API

The app uses **Next.js API Routes** as its backend:

### Core API Routes:
- `POST /api/generate`: Handles image generation request
- Built-in **rate limiting**, **retry logic**, and **API key rotation**
- Scalable batch generation with auto error recovery

---

## 🛠️ Tech Stack

### Frontend:
- [Next.js](https://nextjs.org/) (Fullstack React)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Lucide Icons](https://lucide.dev/)

### AI + Backend:
- [Together AI API](https://www.together.ai/)
- FLUX.1-schnell-Free model
- API Keys + Rate Limit Manager
- Next.js API Routes (serverless functions)

---

## 💻 Local Development

### 1. Clone and install
```bash
git clone https://github.com/uxama-ch/together-ai-image-generator.git
cd together-ai-image-generator
npm install
```
### 2. Set up .env.local
```bash
TOGETHER_API_KEYS=your_api_key1,your_api_key2
```
### 3. Run locally

```bash
npm run dev
```
## 🤝 Contributing
Contributions and suggestions are always welcome!

### To contribute:

- Fork this repository

- Create your branch (git checkout -b feature-xyz)

- Commit your changes (git commit -m 'Add feature')

- Push and open a Pull Request

## 👨‍💻 About the Developer
Usama Riaz

Full Stack Developer & AI Enthusiast

Creating tools that blend AI and UX for real-world use cases.

✉️ Email: usamariaz558@gmail.com

🐙 GitHub: /uxama-ch

🔗 LinkedIn: in/usama-riaz-6a9748248

### 📄 License
This project is licensed under the MIT License.

## 🌐 Live Demo 
Try the live version: [together-image-generator.vercel.app](https://kzmj8kl5eeqypa2bu246.lite.vusercontent.net/)

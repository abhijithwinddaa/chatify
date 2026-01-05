# Chatify 💬

A modern real-time chat application with AI-powered features, built with **React + Vite** and **Node.js + Express + Socket.IO**.

![Chatify](frontend/public/chatify-icon.png)

🌐 **Live Demo:** [chatify.abhijithwinddaa.tech](https://chatify.abhijithwinddaa.tech)

## ✨ Features

### Core Messaging
- **Real-time messaging** with Socket.IO
- **Online status** tracking
- **Image, video, audio sharing** via Cloudinary
- **Voice messages** with audio recording
- **File attachments** with preview
- **Location sharing** with map preview
- **Typing indicators** in real-time
- **Message reactions** with emoji picker
- **Reply to messages** with quote
- **Message editing** and deletion
- **Pin and star** important messages
- **Forward messages** across chats

### Group Features
- **Group creation** with custom settings
- **Public and private** groups
- **Invite links** for easy joining
- **Admin controls** for member management
- **Group message read** tracking

### AI Assistant (Chatify-AI)
- **RAG over chat history** - Search your conversations
- **AI personas** - @summarizer, @finder, @helper, @coder
- **Web search** - Real-time internet information
- **Suggested replies** - AI-powered quick responses
- **Chat summarization** - Condense long conversations
- **Time-filtered search** - Today, week, month filters

### Advanced Features
- **Message templates** with shortcuts
- **Quick replies** panel
- **Disappearing messages** with timer
- **Keyboard sounds** toggle
- **Rate limiting** with Arcjet
- **Welcome emails** via Resend

## 🛠️ Tech Stack

| Frontend | Backend | AI Service | Database |
|----------|---------|------------|----------|
| React 19 | Node.js | Groq LLM | MongoDB |
| Vite | Express | Azure OpenAI | Pinecone |
| Zustand | Socket.IO | Tavily Search | |
| Tailwind CSS | JWT | NodeCache | Cloudinary |
| DaisyUI | | | |

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- MongoDB Atlas account
- Cloudinary account
- Pinecone account (for AI features)

### Installation

```bash
# Clone the repo
git clone https://github.com/abhijithwinddaa/chatify.git
cd chatify

# Install all dependencies
npm run build

# Start main server
npm run start

# For AI features, also run:
cd Chatify-AI
npm install
node server.js
```

### Environment Variables

**Backend (.env)**
```env
PORT=3001
NODE_ENV=development
MONGO_URL=your_mongodb_url
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Resend)
RESEND_API_KEY=your_resend_key
EMAIL_FROM=your_email

# Rate Limiting (Arcjet)
ARCJET_KEY=your_arcjet_key
```

**Chatify-AI (.env)**
```env
AZURE_OPENAI_KEY=your_key
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_DEPLOYMENT=text-embedding-3-small
PINECONE_API_KEY=your_key
PINECONE_INDEX_NAME=chatify-messages
GROQ_API_KEY=your_key
TAVILY_API_KEY=your_key
PORT=3003
```

## 📁 Project Structure

```
chatify/
├── backend/                 # Main CHATIFY backend (Port 3001)
│   └── src/
│       ├── server.js
│       ├── controllers/     # Auth, messages, groups, AI
│       ├── routes/          # API endpoints
│       ├── models/          # MongoDB schemas
│       ├── middleware/      # Auth & rate limiting
│       └── lib/             # Socket, DB, utilities
├── frontend/                # React frontend
│   └── src/
│       ├── App.jsx
│       ├── pages/           # ChatPage, LoginPage, etc.
│       ├── components/      # UI components + AI Modal
│       └── store/           # Zustand state management
└── Chatify-AI/              # AI Microservice (Port 3003)
    └── src/
        ├── services/        # Embedding, LLM, RAG, Web Search
        ├── controllers/     # AI endpoints
        └── routes/          # AI routes
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/check` | Verify session |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/contacts` | Get all users |
| GET | `/api/messages/chats` | Get chat partners |
| GET | `/api/messages/:id` | Get messages with user |
| POST | `/api/messages/send/:id` | Send message |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groups` | Get user's groups |
| POST | `/api/groups` | Create new group |
| POST | `/api/groups/:id/messages` | Send group message |

### AI (Proxied to Chatify-AI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/ask` | Ask AI a question |
| POST | `/api/ai/summarize` | Summarize a chat |
| POST | `/api/ai/suggested-replies` | Get reply suggestions |

## 🤖 AI Features

### Using AI Personas
- Type `@summarizer` to get a summary of your chat
- Type `@finder` to search for specific information
- Type `@helper` for general assistance
- Type `@coder` for programming help

### Example Queries
- "Summarize my chat with John from this week"
- "@finder When did we discuss the deadline?"
- "What meetings do I have tomorrow?"
- "What's the weather today?" (uses web search)

## 📄 License

MIT

---

Made with ❤️ by [Abhijith](https://github.com/abhijithwinddaa)

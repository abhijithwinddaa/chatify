# Chatify 💬

A modern real-time chat application built with **React + Vite** and **Node.js + Express + Socket.IO**.

![Chatify](frontend/public/chatify-icon.png)

## ✨ Features

- **Real-time messaging** with Socket.IO
- **Online status** tracking
- **Image sharing** via Cloudinary
- **JWT authentication** with HTTP-only cookies
- **Rate limiting** with Arcjet
- **Welcome emails** via Resend
- **Responsive UI** with Tailwind CSS + DaisyUI

## 🛠️ Tech Stack

| Frontend | Backend | Database |
|----------|---------|----------|
| React 19 | Node.js | MongoDB |
| Vite | Express | Mongoose |
| Zustand | Socket.IO | |
| Tailwind CSS | JWT | Cloudinary |

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- MongoDB Atlas account
- Cloudinary account

### Installation

```bash
# Clone the repo
git clone https://github.com/abhijithwinddaa/chatify.git
cd chatify

# Install dependencies
npm run build

# Start the server
npm run start
```

### Environment Variables

Create `.env` in the `backend` folder:

```env
PORT=3000
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

## 📁 Project Structure

```
chatify/
├── backend/
│   └── src/
│       ├── server.js          # Entry point
│       ├── controllers/       # Business logic
│       ├── routes/            # API endpoints
│       ├── models/            # MongoDB schemas
│       ├── middleware/        # Auth & rate limiting
│       └── lib/               # Utilities (socket, db, etc.)
└── frontend/
    └── src/
        ├── App.jsx            # Router & layout
        ├── pages/             # ChatPage, LoginPage, SignUpPage
        ├── components/        # UI components
        └── store/             # Zustand state management
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/check` | Verify session |
| PUT | `/api/auth/update-profile` | Update profile pic |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/contacts` | Get all users |
| GET | `/api/messages/chats` | Get chat partners |
| GET | `/api/messages/:id` | Get messages with user |
| POST | `/api/messages/send/:id` | Send message |

## 🔄 Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `getOnlineUsers` | Server → Client | List of online user IDs |

## 📄 License

MIT

---

Made with ❤️ by [Abhijith](https://github.com/abhijithwinddaa)

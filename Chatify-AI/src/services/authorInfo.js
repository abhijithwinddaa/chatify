// Author/Developer information for Chatify AI system prompt
// This info is injected into the AI persona so it can answer questions about who built the app.
// IMPORTANT: Never include phone number or private contact details.

export const AUTHOR_INFO = `
ABOUT THE DEVELOPER/AUTHOR OF CHATIFY:

Name: Abhijith Batturaj
Role: Full-Stack Software Engineer
Education: Master of Computer Applications (MCA) from Amity University, Bengaluru (2023-2025, 8.5 CGPA)

Bio: Abhijith Batturaj is a Full-Stack Software Engineer who builds scalable, production-grade applications with JavaScript (React.js) and Node.js. He has expertise in system design, RESTful APIs, microservices, and performance optimization. He is experienced in real-time and distributed systems with end-to-end ownership from development to deployment. He is also an active open-source contributor delivering reliable, high-impact solutions.

Contact & Social Links:
- Email: abhijithyadav786@gmail.com
- LinkedIn: https://www.linkedin.com/in/batturaj-abhijith
- GitHub: https://github.com/abhijithwinddaa
- Portfolio: https://abhijithwinddaa.tech

About Chatify (This Application):
Abhijith built Chatify as a production-ready real-time chat platform using the MERN stack (MongoDB, Express.js, React.js, Node.js) with Socket.IO. It features a microservices architecture with three separate services: Frontend, Backend, and AI service. Key achievements include:
- <50ms message delivery latency across 100+ concurrent WebSocket connections
- AI-powered semantic search using RAG pipeline with Azure OpenAI embeddings, Pinecone vector database, and Groq LLM, reducing chat history search time by 94% (15s to 800ms)
- Resolved critical cross-browser authentication issues affecting Safari/mobile users (30% of traffic) by implementing SameSite cookie policies and CORS configuration
- Deployed on Vercel and Render with automated CI/CD workflows and zero-downtime deployments

Other Notable Projects:
- JobbyApp: A React-based job discovery platform with advanced filtering, JWT authentication, and reusable component architecture
- Universal-App-Opener: Built Zoom and Substack deep link handlers for iOS/Android (3 PRs merged, open-source)
- Excalidraw (97k+ stars): Contributed grid style feature, keyboard shortcut fixes, and hex color validation (4 PRs open/in review)
- ZIO-Blocks (Scala/ZIO): Implemented MessagePack binary codec with cross-platform support (2 PRs open/in review)

Technical Skills:
- Languages: JavaScript (ES6+), Python, SQL
- Frontend: React.js, HTML5, CSS3, Vite, Responsive Design
- Backend: Node.js, Express.js, RESTful APIs, WebSocket (Socket.IO), Microservices Architecture
- Databases: MongoDB, PostgreSQL, Pinecone (Vector DB), Supabase
- AI/ML: RAG, Azure OpenAI, Groq LLM, Embeddings, LangChain
- Cloud & DevOps: Vercel, Render, CI/CD, Environment Configuration
- Auth & Security: JWT, OAuth 2.0, OWASP Best Practices, CORS, Cookie Policies
- Tools: Git, GitHub, Postman, VS Code
- Architecture: System Design, Microservices, OOP, DSA, Clean Code Principles
`;

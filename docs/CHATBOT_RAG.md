# Chatify-AI: RAG Chatbot System

## Overview

Chatify-AI is an intelligent microservice that powers the AI assistant features in CHATIFY. It uses Retrieval Augmented Generation (RAG) to answer questions about your private chat history, combined with real-time web search for current information.

The system operates as a separate microservice running on port 3003, communicating with the main CHATIFY application through a proxy API layer.

---

## Core Concepts

### What is RAG?

RAG (Retrieval Augmented Generation) allows AI to answer questions about your private data by first searching for relevant information, then using that context to generate accurate answers.

Without RAG, the AI would have no knowledge of your conversations. With RAG, the AI can search your entire message history and provide specific, context-aware responses.

### How Messages Are Indexed

When a user sends a message in CHATIFY, the following happens automatically:
1. The message is saved to MongoDB as usual
2. The text is converted into a 1024-dimensional vector using Azure OpenAI embeddings
3. This vector is stored in Pinecone along with metadata (sender, receiver, timestamp, conversation type)

### How Questions Are Answered

When a user asks the AI a question:
1. The question is converted into a vector embedding
2. Pinecone performs a similarity search to find relevant messages
3. The AI detects which persona mode to use based on @ mentions
4. If needed, a web search is performed for real-time information
5. All context is combined and sent to the LLM (Groq Llama 3.3 70B)
6. The AI generates a response grounded in the user's actual chat data

---

## Architecture

### Microservices Approach

Chatify-AI runs as a separate service (port 3003) from the main CHATIFY backend (port 3001). This provides:
- Independent scaling for AI workloads
- Isolation of AI dependencies
- Easy maintenance and updates
- No impact on main application if AI service is down

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Embeddings | Azure OpenAI text-embedding-3-small | Convert text to 1024-dim vectors |
| Vector Database | Pinecone | Store and search message embeddings |
| LLM | Groq Llama 3.3 70B | Generate intelligent responses |
| Web Search | Tavily | Real-time internet information |
| Memory | NodeCache | 24-hour conversation history |

---

## Features

### AI Personas

Users can invoke specific AI modes by using @ mentions:
- **@summarizer**: Condenses conversations into key points
- **@finder**: Searches for specific information in chat history
- **@helper**: Provides friendly assistance and explanations
- **@coder**: Helps with programming questions and code snippets

### Time-Based Filtering

Search can be filtered by time range:
- Today: Only messages from the current day
- Week: Messages from the past 7 days
- Month: Messages from the past 30 days
- Custom: Specific date range

### Rate Limiting

To ensure fair usage and prevent abuse:
- Ask requests: 20 per minute per user
- Index requests: 100 per minute
- Summarize requests: 10 per minute

### Suggested Replies

The AI analyzes incoming messages and suggests 3 appropriate reply options. These appear above the message input when someone sends you a message.

---

## Privacy and Data

### Conversation Isolation

Each user can only search their own messages. Filters ensure:
- Private chats: Only messages between you and the specific contact
- Group chats: Only messages from groups you belong to
- No cross-user data access

### Data Storage

- Message text is stored in Pinecone as vector embeddings
- Metadata includes sender ID, receiver ID, group ID, and timestamp
- Embeddings cannot be reversed back to original text
- AI conversation memory is cleared after 24 hours

---

## Integration Points

### Frontend

- **Floating AI Button**: Sparkle icon in bottom-right corner of ChatPage
- **AI Chat Contact**: "Chatify AI" appears at top of chats list
- **Suggested Replies**: Shows above message input after receiving a message
- **AI Chat Modal**: Full-screen AI conversation interface

### Backend

- Messages are indexed automatically when sent
- API proxy routes AI requests to the microservice
- Rate limiting is applied at the proxy layer

---

## Use Cases

1. **Finding Information**: "When did John mention the deadline?"
2. **Summarizing Chats**: "Summarize my conversation with Sarah from this week"
3. **Meeting Discovery**: "Do I have any meetings scheduled?"
4. **Task Tracking**: "What tasks did I agree to do?"
5. **Real-time Info**: "What's the weather in New York?" (web search)
6. **Code Help**: "@coder How do I center a div in CSS?"

---

*Built for CHATIFY - A modern real-time chat application with AI-powered features.*

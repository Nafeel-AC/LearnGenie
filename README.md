# 🤖 AI Tutor - RAG-Based Learning System

A comprehensive AI-powered tutoring system that allows users to upload PDF books and chat with them using Retrieval Augmented Generation (RAG). Built with React, FastAPI, LangChain, and integrates with Gemini AI and Pinecone vector database.

## ✨ Features

### 📚 **Book Management**
- **PDF Upload**: Drag & drop or browse to upload PDF books
- **Automatic Processing**: Text extraction and chunking using LangChain
- **Vector Storage**: Store book content in Pinecone for efficient retrieval
- **Book Library**: View all uploaded books with metadata

### 💬 **Interactive Chat**
- **ChatGPT-like Interface**: Clean, modern chat UI with collapsible sidebar
- **Context-Aware Responses**: AI responses based on uploaded book content
- **Chat History**: Persistent conversation history for each book
- **Source Citations**: See relevant excerpts from the book for each response
- **Real-time Typing**: Smooth user experience with loading indicators

### 🔐 **User Management**
- **Authentication**: Secure login/signup with Supabase
- **User Profiles**: Personal profile pages with logout functionality
- **Book Isolation**: Each user only sees their own uploaded books

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Toggle between themes
- **Smooth Animations**: Professional transitions and loading states
- **Drag & Drop**: Intuitive file upload experience

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│────│  FastAPI Backend│────│  Pinecone DB    │
│   (Vite + TailwindCSS)  │   (Python)     │   │  (Vector Store) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   Gemini AI     │
                       │   (LLM)         │
                       └─────────────────┘
```

### **Tech Stack**
- **Frontend**: React 19, Vite, TailwindCSS, React Router
- **Backend**: FastAPI, Python 3.8+
- **AI/ML**: LangChain, Google Gemini AI, HuggingFace Embeddings
- **Database**: Pinecone (Vector DB), Supabase (Auth & Metadata)
- **File Processing**: PyPDF2 for PDF text extraction

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Google AI API key (for Gemini)
- Pinecone account and API key
- Supabase account (optional, for auth)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd ai-tutor
```

### 2. Frontend Setup
```bash
cd vite-project
npm install
npm run dev
```
Frontend will run on `http://localhost:5173`

### 3. Backend Setup
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your API keys (see configuration section)

# Start the backend server
python run.py
```
Backend will run on `http://localhost:8000`

### 4. Configuration

Create `backend/.env` file with your API keys:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=tutor-rag-index
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
```

#### **Getting API Keys**

1. **Gemini API**: Visit [Google AI Studio](https://makersuite.google.com/) to get your API key
2. **Pinecone**: Sign up at [Pinecone](https://www.pinecone.io/) and create an index
3. **Supabase**: Create project at [Supabase](https://supabase.com/) for authentication

## 📱 Usage Guide

### **1. Upload Books**
1. Login to your account
2. Go to Dashboard
3. Drag & drop a PDF file or click "Choose PDF File"
4. Wait for processing to complete

### **2. Chat with Books**
1. Click on any book in your library
2. Ask questions about the book content
3. Get AI responses with source citations
4. View chat history in the sidebar

### **3. Manage Books**
- **Delete**: Click the trash icon on any book card
- **Chat History**: Access previous conversations from the sidebar
- **New Chat**: Start fresh conversations anytime

## 🛠️ Development

### **Project Structure**
```
ai-tutor/
├── vite-project/           # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # Auth context
│   │   └── ...
├── backend/                # Python backend
│   ├── run.py             # Main FastAPI app
│   ├── requirements.txt   # Python dependencies
│   └── .env.example       # Environment template
└── README.md
```

### **Key Components**

#### Frontend
- `Dashboard.jsx`: Book library and upload interface
- `ChatInterface.jsx`: Chat UI with sidebar
- `Profile.jsx`: User profile management
- `AuthContext.jsx`: Authentication state management

#### Backend
- `run.py`: FastAPI server with RAG implementation
- Simple RAG service with PDF processing
- Chat endpoints with conversation memory
- Book management CRUD operations

### **API Endpoints**

```
GET  /                      # Health check
POST /upload-book          # Upload and process PDF
GET  /books               # Get user's books
POST /chat                # Chat with book
GET  /chat-history/{id}   # Get chat history
DELETE /book/{id}         # Delete book
```

## 🔄 Advanced Features (Coming Soon)

- **Full LangChain Integration**: Advanced RAG with vector similarity search
- **Multiple LLM Support**: OpenAI, Claude, local models
- **Advanced Chat**: Context window management, conversation branching
- **Book Analytics**: Reading progress, popular topics
- **Collaborative Features**: Share books and conversations
- **Mobile App**: React Native version

## 🐛 Troubleshooting

### Common Issues

1. **PDF Upload Fails**
   - Ensure PDF is text-based (not scanned images)
   - Check file size (should be < 50MB)
   - Verify backend server is running

2. **Chat Not Working**
   - Check Gemini API key is valid
   - Ensure Pinecone index exists
   - Verify network connectivity

3. **Authentication Issues**
   - Check Supabase configuration
   - Clear browser cache/cookies
   - Verify environment variables

### **Development Tips**
- Use browser dev tools to monitor network requests
- Check backend logs for detailed error messages
- Test with small PDF files first

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

**Happy Learning! 🎓✨** 
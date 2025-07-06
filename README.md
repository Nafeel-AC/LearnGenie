# AI Tutor - Enhanced Multiformat & Web Scraping

An intelligent tutoring system powered by RAG (Retrieval-Augmented Generation) that supports multiple document formats and web content scraping for comprehensive learning experiences.

## 🚀 Features

### 📄 Multi-Format Document Support
- **PDF Documents** - Traditional textbooks and papers
- **Microsoft Office** - Word (.docx, .doc), Excel (.xlsx, .xls), PowerPoint (.pptx, .ppt)
- **Text Files** - Plain text (.txt), Markdown (.md), JSON data
- **Spreadsheets** - CSV files and Excel workbooks
- **Images** - Text extraction via OCR (.png, .jpg, .jpeg, .tiff, .bmp)
- **Web Content** - HTML files and live web scraping

### 🌐 Web Scraping Capabilities
- **Smart Content Extraction** - Automatically detects and extracts main content from web pages
- **Multiple Extraction Methods** - Uses Trafilatura, Newspaper3k, and BeautifulSoup for best results
- **Article Support** - Optimized for news articles, blog posts, and documentation
- **Metadata Extraction** - Captures titles, authors, publication dates, and descriptions

### 🤖 AI-Powered Features
- **Contextual Chat** - Ask questions about your uploaded content
- **MCQ Generation** - Automatically create multiple-choice questions
- **Smart Summarization** - Get key insights from your documents
- **Cross-Format Search** - Find information across all your content types

## 🛠️ Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 16+ (for frontend)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Tutor/backend
   ```

2. **Install dependencies (Easy method)**
   ```bash
   python install_dependencies.py
   ```

3. **Manual installation (Alternative)**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Configure your .env file**
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=your_pinecone_environment
   PINECONE_INDEX_NAME=your_index_name
   PINECONE_HOST=your_pinecone_host
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../vite-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Optional System Dependencies

For enhanced functionality, install these system dependencies:

**🖼️ OCR Support (Image text extraction):**
- Linux: `sudo apt-get install tesseract-ocr`
- macOS: `brew install tesseract`
- Windows: [Download Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)

**🎵 Audio Processing:**
- Linux: `sudo apt-get install ffmpeg`
- macOS: `brew install ffmpeg`
- Windows: [Download FFmpeg](https://ffmpeg.org/download.html)

## 🚀 Usage

### Starting the Application

1. **Start the backend server**
   ```bash
   cd backend
   python main.py
   ```

2. **Start the frontend development server**
   ```bash
   cd vite-project
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:5173`

### Uploading Content

#### File Upload
1. Click on "📁 Upload Files" tab
2. Drag and drop your files or click to browse
3. Supported formats: PDF, Word, Excel, PowerPoint, text files, images
4. Enter a descriptive name for your content
5. Click "Upload Content"

#### Web Scraping
1. Click on "🌐 Scrape Web" tab
2. Enter the URL of the webpage you want to scrape
3. Optionally provide a custom title
4. Click "Scrape Web Content"

### Interacting with Content

1. **Chat with your content** - Ask questions and get contextual answers
2. **Generate MCQs** - Create practice questions automatically
3. **View metadata** - See information about file types, extraction methods, etc.

## 📚 API Documentation

### Endpoints

#### File Upload
```http
POST /upload-book
Content-Type: multipart/form-data

file: [file]
user_id: string
```

#### Web Scraping
```http
POST /scrape-url
Content-Type: application/json

{
  "url": "https://example.com/article",
  "title": "Optional custom title",
  "user_id": "user_id"
}
```

#### Supported Formats
```http
GET /supported-formats
```

#### Chat with Content
```http
POST /chat
Content-Type: application/json

{
  "book_id": "content_id",
  "message": "Your question",
  "user_id": "user_id",
  "chat_history": []
}
```

## 🔧 Architecture

### Backend Components

- **FastAPI Server** - RESTful API with automatic documentation
- **RAG Service** - Enhanced with multiformat processing
- **Document Processor** - Handles various file formats
- **Web Scraper** - Intelligent content extraction from web pages
- **Vector Store** - Pinecone for semantic search
- **Database** - Supabase for metadata and chat history

### Frontend Components

- **React + Vite** - Modern development stack
- **Styled Components** - Dynamic theming support
- **File Upload** - Enhanced drag-and-drop with format validation
- **Web Scraper UI** - User-friendly URL input with validation
- **Chat Interface** - Real-time conversation with content

## 🛡️ Security Considerations

> ⚠️ **Important Security Note**: This project previously had `.env` files exposed in the repository. If you're using this enhanced version:

1. **Regenerate all API keys** in your `.env` file
2. **Verify `.gitignore`** includes `**/.env` patterns
3. **Check git history** for any exposed credentials
4. **Rotate credentials** for Gemini, Pinecone, and Supabase

### Best Practices
- Never commit `.env` files to version control
- Use strong, unique API keys
- Regularly rotate credentials
- Monitor API usage for unusual activity

## 🔍 Troubleshooting

### Common Issues

**"OCR not available" error:**
- Install Tesseract OCR system dependency
- Verify pytesseract package installation

**"Web scraping libraries not available" error:**
- Install web scraping dependencies: `pip install requests beautifulsoup4 trafilatura newspaper3k`

**"Document processing not available" error:**
- Install document processing libraries: `pip install python-docx openpyxl python-pptx`

**File upload fails:**
- Check file size (max 50MB)
- Verify file format is supported
- Check network connection to backend

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export LOG_LEVEL=DEBUG
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **LangChain** - RAG framework
- **Trafilatura** - Web content extraction
- **Newspaper3k** - Article processing
- **Pinecone** - Vector database
- **Supabase** - Backend as a service
- **Google Gemini** - Language model

## 📊 Supported File Formats

| Category | Formats | Features |
|----------|---------|----------|
| Documents | PDF, Word (.docx, .doc) | Text extraction, metadata |
| Spreadsheets | Excel (.xlsx, .xls), CSV | Cell data, sheet names |
| Presentations | PowerPoint (.pptx, .ppt) | Slide content, text extraction |
| Text Files | TXT, Markdown, JSON | Encoding detection, formatting |
| Images | PNG, JPG, JPEG, TIFF, BMP | OCR text extraction |
| Web Content | HTML, Live URLs | Smart content extraction |

## 🌟 What's New

- ✅ **Multi-format document support** - Process 15+ file types
- ✅ **Web scraping capabilities** - Extract content from any webpage
- ✅ **Enhanced UI** - Tabbed interface for file upload vs. web scraping
- ✅ **Smart content detection** - Automatic format recognition
- ✅ **Improved error handling** - Better user feedback
- ✅ **OCR support** - Extract text from images
- ✅ **Comprehensive API** - RESTful endpoints for all features

Start exploring the enhanced AI Tutor today! 🚀 
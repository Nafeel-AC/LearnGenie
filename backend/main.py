from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
from typing import List, Optional
import logging
import json
from pydantic import BaseModel

from rag_service import RAGService
from models import ChatRequest, ChatResponse, Book, ChatHistory

# Define web scraping request model
class WebScrapeRequest(BaseModel):
    url: str
    title: Optional[str] = None
    user_id: str

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define MCQ request model
class MCQRequest(BaseModel):
    book_id: str
    num_questions: int
    difficulty: str
    user_id: str

app = FastAPI(title="AI Tutor RAG API", version="1.0.0")

# Configure CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development)
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG service
rag_service = RAGService()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        await rag_service.initialize()
        logger.info("RAG service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize RAG service: {e}")
        raise

@app.get("/")
async def root():
    return {"message": "AI Tutor RAG API is running"}

@app.post("/upload-book")
async def upload_book(
    file: UploadFile = File(...),
    user_id: str = None
):
    """Upload a document and process it for RAG (supports multiple formats)"""
    try:
        # Check if format is supported
        if not rag_service.is_supported_format(file.filename):
            supported_formats = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.pptx', '.ppt', '.txt', '.md', '.json', '.png', '.jpg', '.jpeg', '.html', '.htm']
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format. Supported formats: {', '.join(supported_formats)}"
            )
        
        # Read file content
        content = await file.read()
        
        # Process the document
        book_id = await rag_service.process_book(
            file_content=content,
            filename=file.filename,
            user_id=user_id
        )
        
        return {"book_id": book_id, "message": "Document uploaded and processed successfully"}
    
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/books")
async def get_user_books(user_id: str):
    """Get all books for a user"""
    try:
        books = await rag_service.get_user_books(user_id)
        return {"books": books}
    
    except Exception as e:
        logger.error(f"Error getting user books: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_with_book(request: ChatRequest):
    """Chat with a specific book using RAG"""
    try:
        response = await rag_service.chat_with_book(
            book_id=request.book_id,
            message=request.message,
            user_id=request.user_id,
            chat_history=request.chat_history
        )
        
        return response
    
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat-history/{book_id}")
async def get_chat_history(book_id: str, user_id: str):
    """Get chat history for a specific book"""
    try:
        history = await rag_service.get_chat_history(book_id, user_id)
        return {"chat_history": history}
    
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/book/{book_id}")
async def delete_book(book_id: str, user_id: str):
    """Delete a book and its associated data"""
    try:
        await rag_service.delete_book(book_id, user_id)
        return {"message": "Book deleted successfully"}
    
    except Exception as e:
        logger.error(f"Error deleting book: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-mcqs")
async def generate_mcqs(request: MCQRequest):
    """Generate MCQs from a specific book"""
    try:
        mcqs = await rag_service.generate_mcqs(
            book_id=request.book_id,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            user_id=request.user_id
        )
        return {"mcqs": mcqs}
    
    except Exception as e:
        logger.error(f"Error generating MCQs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/scrape-url")
async def scrape_url(request: WebScrapeRequest):
    """Scrape content from URL and process it as a document"""
    try:
        book_id = await rag_service.scrape_and_process_url(
            url=request.url,
            user_id=request.user_id,
            title=request.title
        )
        
        return {
            "book_id": book_id, 
            "message": "Web content scraped and processed successfully",
            "url": request.url
        }
    
    except Exception as e:
        logger.error(f"Error scraping URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/supported-formats")
async def get_supported_formats():
    """Get list of supported file formats"""
    return {
        "supported_formats": {
            "documents": [".pdf", ".docx", ".doc"],
            "spreadsheets": [".xlsx", ".xls", ".csv"],
            "presentations": [".pptx", ".ppt"],
            "text_files": [".txt", ".md", ".markdown", ".json"],
            "images": [".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".gif"],
            "audio": [".wav", ".mp3", ".m4a", ".flac", ".aac"],
            "web": [".html", ".htm", "URLs"]
        },
        "web_scraping": True,
        "message": "Multiple document formats and web scraping supported"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
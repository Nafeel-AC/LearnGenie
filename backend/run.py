#!/usr/bin/env python3

import os
import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import PyPDF2
from io import BytesIO

# FastAPI imports
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic Models
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    book_id: str
    message: str
    user_id: str
    chat_history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[Dict[str, Any]]] = []
    book_id: str

class Book(BaseModel):
    id: str
    title: str
    filename: str
    user_id: str
    upload_date: datetime
    page_count: Optional[int] = None
    file_size: Optional[int] = None
    status: str = "processed"

# Simple RAG Service (simplified for demo)
class SimpleRAGService:
    def __init__(self):
        self.books_db = {}
        self.chat_histories = {}
        
    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF file"""
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            
            return text
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise
    
    async def process_book(self, file_content: bytes, filename: str, user_id: str) -> str:
        """Process a PDF book and store it"""
        try:
            book_id = str(uuid.uuid4())
            
            # Extract text from PDF
            text = self.extract_text_from_pdf(file_content)
            
            if not text.strip():
                raise ValueError("No text could be extracted from the PDF")
            
            # Store book metadata and content
            book = Book(
                id=book_id,
                title=filename.replace(".pdf", ""),
                filename=filename,
                user_id=user_id,
                upload_date=datetime.now(),
                file_size=len(file_content),
                status="processed"
            )
            
            self.books_db[book_id] = {
                "book": book,
                "content": text
            }
            
            logger.info(f"Successfully processed book: {filename} with ID: {book_id}")
            return book_id
            
        except Exception as e:
            logger.error(f"Error processing book: {e}")
            raise
    
    async def get_user_books(self, user_id: str) -> List[Book]:
        """Get all books for a specific user"""
        try:
            user_books = [
                data["book"] for data in self.books_db.values() 
                if data["book"].user_id == user_id
            ]
            return user_books
        except Exception as e:
            logger.error(f"Error getting user books: {e}")
            raise
    
    async def chat_with_book(
        self, 
        book_id: str, 
        message: str, 
        user_id: str, 
        chat_history: List[ChatMessage] = None
    ) -> ChatResponse:
        """Simple chat implementation"""
        try:
            if book_id not in self.books_db:
                raise ValueError("Book not found")
            
            book_data = self.books_db[book_id]
            if book_data["book"].user_id != user_id:
                raise ValueError("Unauthorized access to book")
            
            # Simple response (in real implementation, use RAG with LangChain)
            content = book_data["content"]
            response = f"Based on the book '{book_data['book'].title}', here's what I found related to your question: '{message}'\n\n"
            
            # Find relevant parts (simple keyword matching for demo)
            relevant_parts = []
            words = message.lower().split()
            content_lower = content.lower()
            
            for word in words:
                if word in content_lower:
                    # Find sentences containing the word
                    sentences = content.split('.')
                    for sentence in sentences:
                        if word in sentence.lower():
                            relevant_parts.append(sentence.strip())
                            if len(relevant_parts) >= 3:
                                break
                    break
            
            if relevant_parts:
                response += "Here are some relevant excerpts:\n\n" + "\n\n".join(relevant_parts[:2])
            else:
                response += "I couldn't find specific information about that topic in this book. Could you rephrase your question or ask about something else from the book?"
            
            # Save chat history
            await self._save_chat_message(book_id, user_id, message, response)
            
            return ChatResponse(
                response=response,
                sources=[{"content": part[:200] + "..." if len(part) > 200 else part} for part in relevant_parts[:2]],
                book_id=book_id
            )
            
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            raise
    
    async def _save_chat_message(self, book_id: str, user_id: str, user_message: str, ai_response: str):
        """Save chat messages to history"""
        chat_key = f"{book_id}_{user_id}"
        
        if chat_key not in self.chat_histories:
            self.chat_histories[chat_key] = []
        
        self.chat_histories[chat_key].extend([
            ChatMessage(role="user", content=user_message, timestamp=datetime.now()),
            ChatMessage(role="assistant", content=ai_response, timestamp=datetime.now())
        ])
    
    async def get_chat_history(self, book_id: str, user_id: str) -> List[ChatMessage]:
        """Get chat history for a specific book"""
        chat_key = f"{book_id}_{user_id}"
        return self.chat_histories.get(chat_key, [])
    
    async def delete_book(self, book_id: str, user_id: str):
        """Delete a book and its associated data"""
        if book_id not in self.books_db:
            raise ValueError("Book not found")
        
        book_data = self.books_db[book_id]
        if book_data["book"].user_id != user_id:
            raise ValueError("Unauthorized access to book")
        
        del self.books_db[book_id]
        
        chat_key = f"{book_id}_{user_id}"
        if chat_key in self.chat_histories:
            del self.chat_histories[chat_key]

# Initialize FastAPI app
app = FastAPI(title="AI Tutor RAG API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG service
rag_service = SimpleRAGService()

@app.get("/")
async def root():
    return {"message": "AI Tutor RAG API is running"}

@app.post("/upload-book")
async def upload_book(file: UploadFile = File(...), user_id: str = "demo_user"):
    """Upload a PDF book and process it for RAG"""
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        content = await file.read()
        book_id = await rag_service.process_book(content, file.filename, user_id)
        
        return {"book_id": book_id, "message": "Book uploaded and processed successfully"}
    
    except Exception as e:
        logger.error(f"Error uploading book: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/books")
async def get_user_books(user_id: str = "demo_user"):
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
async def get_chat_history(book_id: str, user_id: str = "demo_user"):
    """Get chat history for a specific book"""
    try:
        history = await rag_service.get_chat_history(book_id, user_id)
        return {"chat_history": history}
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/book/{book_id}")
async def delete_book(book_id: str, user_id: str = "demo_user"):
    """Delete a book and its associated data"""
    try:
        await rag_service.delete_book(book_id, user_id)
        return {"message": "Book deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting book: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
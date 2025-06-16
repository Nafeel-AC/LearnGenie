from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

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
    status: str = "processed"  # 'processing', 'processed', 'error'

class ChatHistory(BaseModel):
    id: str
    book_id: str
    user_id: str
    messages: List[ChatMessage]
    created_at: datetime
    updated_at: datetime

class BookUploadResponse(BaseModel):
    book_id: str
    message: str
    status: str

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None 
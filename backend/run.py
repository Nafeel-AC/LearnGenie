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

# LangChain imports
try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain.embeddings import HuggingFaceEmbeddings
    from langchain.schema import Document
    from langchain_google_genai import ChatGoogleGenerativeAI
    from pinecone import Pinecone, ServerlessSpec
    import tiktoken
    LANGCHAIN_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  LangChain components not available: {e}")
    print("💡 Install with: pip install langchain langchain-google-genai pinecone-client sentence-transformers")
    LANGCHAIN_AVAILABLE = False

# Supabase imports
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Supabase client not available: {e}")
    print("💡 Install with: pip install supabase")
    SUPABASE_AVAILABLE = False

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
    conversation_id: Optional[str] = None
    chat_history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[Dict[str, Any]]] = []
    book_id: str
    conversation_id: str

class Book(BaseModel):
    id: str
    title: str
    filename: str
    original_filename: str
    user_id: str
    upload_date: datetime
    page_count: Optional[int] = None
    file_size: Optional[int] = None
    status: str = "processed"
    pinecone_namespace: Optional[str] = None
    processed_date: Optional[datetime] = None

class Conversation(BaseModel):
    id: str
    book_id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0

# Full RAG Service with Pinecone
class RAGService:
    def __init__(self):
        self.supabase_client = None
        self.pinecone_client = None
        self.pinecone_index = None
        self.embeddings = None
        self.llm = None
        self.text_splitter = None
        self.initialized = False
    
    def _create_namespace_name(self, book_name: str, book_id: str) -> str:
        """Create a clean namespace name for Pinecone"""
        import re
        # Clean the book name: lowercase, replace spaces with hyphens, remove special chars
        clean_name = re.sub(r'[^a-zA-Z0-9\s\-_]', '', book_name.lower())
        clean_name = re.sub(r'\s+', '-', clean_name.strip())
        # Limit length and add book_id suffix for uniqueness
        clean_name = clean_name[:30] + f"-{book_id[:8]}"
        return clean_name
    
    async def initialize(self):
        """Initialize RAG components"""
        try:
            logger.info("Initializing RAG service...")
            
            # Initialize Supabase client
            if SUPABASE_AVAILABLE:
                supabase_url = os.getenv("SUPABASE_URL")
                supabase_key = os.getenv("SUPABASE_KEY")
                
                if supabase_url and supabase_key:
                    self.supabase_client = create_client(supabase_url, supabase_key)
                    logger.info("✅ Supabase client initialized")
                else:
                    logger.warning("⚠️  SUPABASE_URL or SUPABASE_KEY not found")
            else:
                logger.warning("⚠️  Supabase not available, using in-memory storage")
            
            if not LANGCHAIN_AVAILABLE:
                logger.warning("LangChain not available, using simple keyword matching")
                self.initialized = True
                return
            
            # Initialize embeddings
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-mpnet-base-v2",
                model_kwargs={'device': 'cpu'}
            )
            
            # Initialize text splitter
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len
            )
            
            # Initialize Gemini LLM if API key is available
            gemini_key = os.getenv("GEMINI_API_KEY")
            if gemini_key:
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-2.0-flash",
                    google_api_key=gemini_key,
                    temperature=0.3
                )
                logger.info("✅ Gemini 2.0 Flash LLM initialized")
            else:
                logger.warning("⚠️  GEMINI_API_KEY not found, chat will use simple responses")
            
            # Initialize Pinecone
            pinecone_key = os.getenv("PINECONE_API_KEY")
            pinecone_host = os.getenv("PINECONE_HOST")
            
            if pinecone_key:
                self.pinecone_client = Pinecone(api_key=pinecone_key)
                
                index_name = os.getenv("PINECONE_INDEX_NAME", "tutor-rag-index")
                
                # Check if index exists
                existing_indexes = [index.name for index in self.pinecone_client.list_indexes()]
                
                if index_name not in existing_indexes:
                    logger.info(f"Creating Pinecone index: {index_name}")
                    self.pinecone_client.create_index(
                        name=index_name,
                        dimension=768,  # all-mpnet-base-v2 dimension
                        metric="cosine",
                        spec=ServerlessSpec(
                            cloud="aws",
                            region="us-east-1"
                        )
                    )
                
                # Connect to index with host URL if provided
                if pinecone_host:
                    self.pinecone_index = self.pinecone_client.Index(index_name, host=pinecone_host)
                    logger.info(f"✅ Pinecone index '{index_name}' connected via host: {pinecone_host}")
                else:
                    self.pinecone_index = self.pinecone_client.Index(index_name)
                    logger.info(f"✅ Pinecone index '{index_name}' connected")
            else:
                logger.warning("⚠️  PINECONE_API_KEY not found, using in-memory storage")
            
            self.initialized = True
            logger.info("🚀 RAG service initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Error initializing RAG service: {e}")
            # Fall back to simple mode
            self.initialized = True
        
    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF file"""
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            if len(pdf_reader.pages) == 0:
                raise ValueError("PDF file contains no pages")
            
            text = ""
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += f"\n--- Page {page_num + 1} ---\n"
                        text += page_text
                except Exception as e:
                    logger.warning(f"Could not extract text from page {page_num + 1}: {e}")
                    continue
            
            # Clean up the text
            text = text.strip()
            if not text:
                raise ValueError("No text could be extracted from the PDF. This might be a scanned document or image-based PDF.")
            
            logger.info(f"Successfully extracted {len(text)} characters from {len(pdf_reader.pages)} pages")
            return text
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise ValueError(f"Failed to process PDF: {str(e)}")
    
    async def process_book(self, file_content: bytes, filename: str, book_name: str, user_id: str) -> str:
        """Process a PDF book and store it in vector database"""
        try:
            book_id = str(uuid.uuid4())
            logger.info(f"Processing book: '{book_name}' ({filename}) for user: {user_id}")
            
            # Create namespace name (clean book name for Pinecone)
            namespace = self._create_namespace_name(book_name, book_id)
            
            # Extract text from PDF
            text = self.extract_text_from_pdf(file_content)
            
            if not text.strip():
                raise ValueError("No text could be extracted from the PDF")
            
            # Store book metadata in Supabase
            book = Book(
                id=book_id,
                title=book_name,
                filename=filename,
                original_filename=filename,
                user_id=user_id,
                upload_date=datetime.now(),
                file_size=len(file_content),
                status="processing",
                pinecone_namespace=namespace
            )
            
            # Store in Supabase
            if self.supabase_client:
                try:
                    self.supabase_client.table("books").insert({
                        "id": book_id,
                        "user_id": user_id,
                        "title": book_name,
                        "filename": filename,
                        "original_filename": filename,
                        "file_size": len(file_content),
                        "status": "processing",
                        "pinecone_namespace": namespace
                    }).execute()
                    logger.info(f"✅ Book metadata stored in Supabase: {book_id}")
                except Exception as e:
                    logger.error(f"❌ Error storing book in Supabase: {e}")
            else:
                logger.warning("⚠️  Supabase not available, book metadata not persisted")
            
            # Process with RAG if available
            if LANGCHAIN_AVAILABLE and self.text_splitter and self.embeddings:
                try:
                    # Split text into chunks
                    documents = self.text_splitter.split_text(text)
                    logger.info(f"Split into {len(documents)} chunks")
                    
                    if self.pinecone_index:
                        # Create embeddings and store in Pinecone
                        vectors_to_upsert = []
                        
                        for i, chunk in enumerate(documents):
                            # Generate embedding
                            embedding = self.embeddings.embed_query(chunk)
                            
                            # Create vector
                            vector_id = f"{book_id}_{i}"
                            vectors_to_upsert.append({
                                "id": vector_id,
                                "values": embedding,
                                "metadata": {
                                    "book_id": book_id,
                                    "user_id": user_id,
                                    "filename": filename,
                                    "chunk_index": i,
                                    "text": chunk[:1000],  # Store first 1000 chars for preview
                                    "chunk_text": chunk  # Store full chunk text
                                }
                            })
                        
                        # Batch upsert to Pinecone with namespace
                        batch_size = 100
                        for i in range(0, len(vectors_to_upsert), batch_size):
                            batch = vectors_to_upsert[i:i + batch_size]
                            self.pinecone_index.upsert(vectors=batch, namespace=namespace)
                        
                        logger.info(f"✅ Stored {len(vectors_to_upsert)} vectors in Pinecone namespace '{namespace}' for book: '{book_name}'")
                    else:
                        logger.warning("Pinecone not available, content not stored")
                    
                    # Update book status in Supabase
                    if self.supabase_client:
                        try:
                            self.supabase_client.table("books").update({
                                "status": "processed",
                                "processed_date": datetime.now().isoformat()
                            }).eq("id", book_id).execute()
                            logger.info(f"✅ Book status updated to 'processed' in Supabase: {book_id}")
                        except Exception as e:
                            logger.error(f"❌ Error updating book status in Supabase: {e}")
                    
                except Exception as e:
                    logger.error(f"Error in RAG processing: {e}")
                    # Update status to failed in Supabase
                    if self.supabase_client:
                        try:
                            self.supabase_client.table("books").update({
                                "status": "failed"
                            }).eq("id", book_id).execute()
                        except Exception as supabase_error:
                            logger.error(f"❌ Error updating failed status in Supabase: {supabase_error}")
            else:
                logger.info("Using simple storage (LangChain not available)")
                # Update status to processed in Supabase
                if self.supabase_client:
                    try:
                        self.supabase_client.table("books").update({
                            "status": "processed",
                            "processed_date": datetime.now().isoformat()
                        }).eq("id", book_id).execute()
                    except Exception as e:
                        logger.error(f"❌ Error updating book status in Supabase: {e}")
            
            logger.info(f"Successfully processed book: {filename} with ID: {book_id}")
            return book_id
            
        except Exception as e:
            logger.error(f"Error processing book: {e}")
            raise
    
    async def get_user_books(self, user_id: str) -> List[Book]:
        """Get all books for a specific user from Supabase"""
        try:
            if self.supabase_client:
                response = self.supabase_client.table("books").select("*").eq("user_id", user_id).order("upload_date", desc=True).execute()
                
                user_books = []
                for book_data in response.data:
                    book = Book(
                        id=book_data["id"],
                        title=book_data["title"],
                        filename=book_data["filename"],
                        original_filename=book_data["original_filename"],
                        user_id=book_data["user_id"],
                        upload_date=datetime.fromisoformat(book_data["upload_date"].replace('Z', '+00:00')),
                        file_size=book_data.get("file_size"),
                        page_count=book_data.get("page_count"),
                        status=book_data["status"],
                        pinecone_namespace=book_data.get("pinecone_namespace"),
                        processed_date=datetime.fromisoformat(book_data["processed_date"].replace('Z', '+00:00')) if book_data.get("processed_date") else None
                    )
                    user_books.append(book)
                
                return user_books
            else:
                logger.warning("Supabase not available, returning empty list")
                return []
        except Exception as e:
            logger.error(f"Error getting user books: {e}")
            raise
    
    async def create_conversation(self, book_id: str, user_id: str, title: str) -> str:
        """Create a new conversation"""
        if not self.supabase_client:
            raise ValueError("Database not available")
            
        try:
            conversation_id = str(uuid.uuid4())
            conversation_data = {
                "id": conversation_id,
                "book_id": book_id,
                "user_id": user_id,
                "title": title
            }
            
            self.supabase_client.table("conversations").insert(conversation_data).execute()
            logger.info(f"✅ Created new conversation: {conversation_id}")
            return conversation_id
        except Exception as e:
            logger.error(f"❌ Error creating conversation: {e}")
            raise

    async def get_conversations(self, book_id: str, user_id: str) -> List[Conversation]:
        """Get all conversations for a book"""
        if not self.supabase_client:
            return []
            
        try:
            response = self.supabase_client.table("conversations").select("*").eq("book_id", book_id).eq("user_id", user_id).order("updated_at", desc=True).execute()
            
            conversations = []
            for conv_data in response.data:
                # Count messages in this conversation
                msg_response = self.supabase_client.table("chat_histories").select("id", count="exact").eq("conversation_id", conv_data["id"]).eq("role", "user").execute()
                
                conversation = Conversation(
                    id=conv_data["id"],
                    book_id=conv_data["book_id"],
                    user_id=conv_data["user_id"],
                    title=conv_data["title"],
                    created_at=datetime.fromisoformat(conv_data["created_at"].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(conv_data["updated_at"].replace('Z', '+00:00')),
                    message_count=msg_response.count or 0
                )
                conversations.append(conversation)
            
            return conversations
        except Exception as e:
            logger.error(f"❌ Error getting conversations: {e}")
            return []

    async def _save_chat_message(self, conversation_id: str, book_id: str, user_id: str, user_message: str, ai_response: str):
        """Save chat messages to Supabase with conversation support"""
        if not self.supabase_client:
            logger.warning("Supabase not available, chat history not saved")
            return
            
        try:
            # Save both user message and AI response
            messages_to_save = [
                {
                    "conversation_id": conversation_id,
                    "book_id": book_id,
                    "user_id": user_id,
                    "role": "user",
                    "content": user_message
                },
                {
                    "conversation_id": conversation_id,
                    "book_id": book_id,
                    "user_id": user_id,
                    "role": "assistant",
                    "content": ai_response
                }
            ]
            
            self.supabase_client.table("chat_histories").insert(messages_to_save).execute()
            
            # Update conversation timestamp
            self.supabase_client.table("conversations").update({
                "updated_at": datetime.now().isoformat()
            }).eq("id", conversation_id).execute()
            
            logger.info(f"✅ Chat messages saved to Supabase for conversation: {conversation_id}")
        except Exception as e:
            logger.error(f"❌ Error saving chat messages to Supabase: {e}")

    async def get_chat_history(self, book_id: str, user_id: str) -> List[ChatMessage]:
        """Get all chat history for a book (from all conversations)"""
        if not self.supabase_client:
            return []
            
        try:
            response = self.supabase_client.table("chat_histories").select("*").eq("book_id", book_id).eq("user_id", user_id).order("created_at", desc=False).execute()
            
            chat_history = []
            for message_data in response.data:
                message = ChatMessage(
                    role=message_data["role"],
                    content=message_data["content"],
                    timestamp=datetime.fromisoformat(message_data["created_at"].replace('Z', '+00:00'))
                )
                chat_history.append(message)
            
            return chat_history
        except Exception as e:
            logger.error(f"❌ Error getting chat history: {e}")
            return []

    async def chat_with_book(
        self, 
        book_id: str, 
        message: str, 
        user_id: str, 
        conversation_id: Optional[str] = None,
        chat_history: List[ChatMessage] = None
    ) -> ChatResponse:
        """Chat with book using RAG"""
        try:
            # Get book data from Supabase
            if not self.supabase_client:
                raise ValueError("Database not available")
                
            response = self.supabase_client.table("books").select("*").eq("id", book_id).eq("user_id", user_id).execute()
            
            if not response.data:
                raise ValueError("Book not found or unauthorized access")
            
            book_data = response.data[0]
            book_title = book_data["title"]
            namespace = book_data.get("pinecone_namespace", "default")
            
            # Create conversation if none provided
            if not conversation_id:
                # Use first 40 chars of message as title
                title = message[:40] + "..." if len(message) > 40 else message
                conversation_id = await self.create_conversation(book_id, user_id, title)
            
            # Try RAG with Pinecone if available
            if (LANGCHAIN_AVAILABLE and self.pinecone_index and 
                self.embeddings and self.llm):
                try:
                    # Generate embedding for the question
                    question_embedding = self.embeddings.embed_query(message)
                    
                    # Search for relevant chunks in Pinecone using namespace
                    search_results = self.pinecone_index.query(
                        vector=question_embedding,
                        namespace=namespace,
                        top_k=4,
                        include_metadata=True
                    )
                    
                    if search_results.matches:
                        # Extract relevant text chunks
                        relevant_chunks = []
                        for match in search_results.matches:
                            chunk_text = match.metadata.get('chunk_text', match.metadata.get('text', ''))
                            if chunk_text:
                                relevant_chunks.append(chunk_text)
                        
                        # Build context from relevant chunks
                        context = "\n\n".join(relevant_chunks[:3])
                        
                        # Build chat history context
                        history_context = ""
                        if chat_history:
                            recent_history = chat_history[-6:]  # Last 3 exchanges
                            for msg in recent_history:
                                history_context += f"{msg.role}: {msg.content}\n"
                        
                        # Create prompt for Gemini
                        prompt = f"""You are an AI tutor helping a student understand the book "{book_title}". 
Based on the following context from the book, answer the student's question clearly and helpfully.

Book Context:
{context}

{"Chat History:" + history_context if history_context else ""}

Student Question: {message}

Instructions:
- Answer based on the provided context from the book
- Be educational and clear
- If the context doesn't contain relevant information, say so
- Cite specific parts of the text when relevant
- Keep responses focused and helpful

Answer:"""
                        
                        # Get response from Gemini
                        ai_response = self.llm.invoke(prompt).content
                        
                        logger.info(f"✅ RAG response generated using {len(relevant_chunks)} chunks")
                        
                        # Save chat history
                        await self._save_chat_message(conversation_id, book_id, user_id, message, ai_response)
                        
                        return ChatResponse(
                            response=ai_response,
                            sources=[],
                            book_id=book_id,
                            conversation_id=conversation_id
                        )
                        
                    else:
                        ai_response = f"I couldn't find specific information about '{message}' in the book '{book_title}'. Could you try rephrasing your question or asking about a different topic from the book?"
                        
                        # Save chat history
                        await self._save_chat_message(conversation_id, book_id, user_id, message, ai_response)
                        
                        return ChatResponse(
                            response=ai_response,
                            sources=[],
                            book_id=book_id,
                            conversation_id=conversation_id
                        )
                        
                except Exception as e:
                    logger.error(f"Error in RAG processing: {e}")
                    # Fall back to error response
                    ai_response = f"I encountered an issue searching the book: {str(e)}"
                    await self._save_chat_message(conversation_id, book_id, user_id, message, ai_response)
                    
                    return ChatResponse(
                        response=ai_response,
                        sources=[],
                        book_id=book_id,
                        conversation_id=conversation_id
                    )
            
            # Fallback response if RAG is not available
            ai_response = f"I'm having trouble accessing the content of '{book_title}'. The RAG system may not be properly initialized. Please try uploading the book again."
            
            # Save chat history
            await self._save_chat_message(conversation_id, book_id, user_id, message, ai_response)
            
            return ChatResponse(
                response=ai_response,
                sources=[],
                book_id=book_id,
                conversation_id=conversation_id
            )
            
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            raise

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
rag_service = RAGService()

@app.on_event("startup")
async def startup_event():
    """Initialize RAG service on startup"""
    await rag_service.initialize()

@app.get("/")
async def root():
    return {
        "message": "AI Tutor RAG API is running",
        "rag_available": LANGCHAIN_AVAILABLE,
        "pinecone_connected": rag_service.pinecone_index is not None,
        "gemini_available": rag_service.llm is not None
    }

@app.post("/upload-book")
async def upload_book(
    file: UploadFile = File(...), 
    book_name: str = None,
    user_id: str = "demo_user"
):
    """Upload a PDF book and process it for RAG"""
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Validate file size (50MB limit)
        content = await file.read()
        if len(content) > 50 * 1024 * 1024:  # 50MB
            raise HTTPException(status_code=400, detail="File size too large. Maximum 50MB allowed.")
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Use provided book name or fallback to filename
        final_book_name = book_name.strip() if book_name else file.filename.replace(".pdf", "")
        
        logger.info(f"Processing upload: '{final_book_name}' ({len(content)} bytes) for user: {user_id}")
        
        # Process the book
        book_id = await rag_service.process_book(content, file.filename, final_book_name, user_id)
        
        return {
            "book_id": book_id, 
            "message": "Book uploaded and processed successfully",
            "filename": file.filename,
            "book_name": final_book_name,
            "size": len(content)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading book: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

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
    """Chat with book using RAG"""
    try:
        response = await rag_service.chat_with_book(
            book_id=request.book_id,
            message=request.message,
            user_id=request.user_id,
            conversation_id=request.conversation_id,
            chat_history=request.chat_history
        )
        return response
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations/{book_id}")
async def get_conversations(book_id: str, user_id: str = "demo_user"):
    """Get all conversations for a book"""
    try:
        conversations = await rag_service.get_conversations(book_id, user_id)
        return {"conversations": conversations}
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/conversations")
async def create_conversation(book_id: str, title: str, user_id: str = "demo_user"):
    """Create a new conversation"""
    try:
        conversation_id = await rag_service.create_conversation(book_id, user_id, title)
        return {"conversation_id": conversation_id}
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversation-history/{conversation_id}")
async def get_conversation_history(conversation_id: str, user_id: str = "demo_user"):
    """Get chat history for a specific conversation"""
    try:
        chat_history = await rag_service.get_chat_history(conversation_id, user_id)
        return {"chat_history": chat_history}
    except Exception as e:
        logger.error(f"Error getting conversation history: {e}")
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
import os
import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import PyPDF2
from io import BytesIO

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.vectorstores import Pinecone
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.schema import Document
import pinecone

from models import Book, ChatMessage, ChatResponse, ChatHistory

# Configure logging
logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.llm = None
        self.embeddings = None
        self.vectorstore = None
        self.text_splitter = None
        self.books_db = {}  # In-memory storage for demo (use real DB in production)
        self.chat_histories = {}  # In-memory storage for chat histories
        
    async def initialize(self):
        """Initialize all the RAG components"""
        try:
            # Initialize Pinecone
            pinecone.init(
                api_key=os.getenv("PINECONE_API_KEY"),
                environment=os.getenv("PINECONE_ENVIRONMENT")
            )
            
            # Initialize embeddings
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'}
            )
            
            # Initialize LLM
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-pro",
                google_api_key=os.getenv("GEMINI_API_KEY"),
                temperature=0.1
            )
            
            # Initialize text splitter
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len
            )
            
            # Initialize or connect to Pinecone index
            index_name = os.getenv("PINECONE_INDEX_NAME", "tutor-rag-index")
            
            # Check if index exists, create if it doesn't
            if index_name not in pinecone.list_indexes():
                pinecone.create_index(
                    name=index_name,
                    dimension=384,  # Dimension for all-MiniLM-L6-v2
                    metric="cosine"
                )
                logger.info(f"Created new Pinecone index: {index_name}")
            
            self.index = pinecone.Index(index_name)
            logger.info("RAG service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing RAG service: {e}")
            raise
    
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
        """Process a PDF book and store it in vector database"""
        try:
            book_id = str(uuid.uuid4())
            
            # Extract text from PDF
            text = self.extract_text_from_pdf(file_content)
            
            if not text.strip():
                raise ValueError("No text could be extracted from the PDF")
            
            # Split text into chunks
            documents = self.text_splitter.split_text(text)
            
            # Create Document objects with metadata
            docs = [
                Document(
                    page_content=chunk,
                    metadata={
                        "book_id": book_id,
                        "user_id": user_id,
                        "filename": filename,
                        "chunk_id": i
                    }
                ) for i, chunk in enumerate(documents)
            ]
            
            # Store in Pinecone
            Pinecone.from_documents(
                docs,
                self.embeddings,
                index_name=os.getenv("PINECONE_INDEX_NAME", "tutor-rag-index")
            )
            
            # Store book metadata
            book = Book(
                id=book_id,
                title=filename.replace(".pdf", ""),
                filename=filename,
                user_id=user_id,
                upload_date=datetime.now(),
                file_size=len(file_content),
                status="processed"
            )
            
            self.books_db[book_id] = book
            
            logger.info(f"Successfully processed book: {filename} with ID: {book_id}")
            return book_id
            
        except Exception as e:
            logger.error(f"Error processing book: {e}")
            raise
    
    async def get_user_books(self, user_id: str) -> List[Book]:
        """Get all books for a specific user"""
        try:
            user_books = [
                book for book in self.books_db.values() 
                if book.user_id == user_id
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
        """Chat with a specific book using RAG"""
        try:
            if book_id not in self.books_db:
                raise ValueError("Book not found")
            
            book = self.books_db[book_id]
            if book.user_id != user_id:
                raise ValueError("Unauthorized access to book")
            
            # Create vectorstore for this book
            vectorstore = Pinecone.from_existing_index(
                index_name=os.getenv("PINECONE_INDEX_NAME", "tutor-rag-index"),
                embedding=self.embeddings
            )
            
            # Create retriever with book-specific filter
            retriever = vectorstore.as_retriever(
                search_kwargs={
                    "filter": {"book_id": book_id},
                    "k": 4
                }
            )
            
            # Create conversation memory
            memory = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True,
                output_key="answer"
            )
            
            # Add previous chat history to memory
            if chat_history:
                for msg in chat_history:
                    if msg.role == "user":
                        memory.chat_memory.add_user_message(msg.content)
                    else:
                        memory.chat_memory.add_ai_message(msg.content)
            
            # Create conversational retrieval chain
            qa_chain = ConversationalRetrievalChain.from_llm(
                llm=self.llm,
                retriever=retriever,
                memory=memory,
                return_source_documents=True,
                verbose=True
            )
            
            # Get response
            result = qa_chain({"question": message})
            
            # Extract source information
            sources = []
            if result.get("source_documents"):
                for doc in result["source_documents"]:
                    sources.append({
                        "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                        "metadata": doc.metadata
                    })
            
            # Save chat history
            await self._save_chat_message(book_id, user_id, message, result["answer"])
            
            return ChatResponse(
                response=result["answer"],
                sources=sources,
                book_id=book_id
            )
            
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            raise
    
    async def _save_chat_message(self, book_id: str, user_id: str, user_message: str, ai_response: str):
        """Save chat messages to history"""
        try:
            chat_key = f"{book_id}_{user_id}"
            
            if chat_key not in self.chat_histories:
                self.chat_histories[chat_key] = []
            
            # Add user message
            self.chat_histories[chat_key].append(
                ChatMessage(
                    role="user",
                    content=user_message,
                    timestamp=datetime.now()
                )
            )
            
            # Add AI response
            self.chat_histories[chat_key].append(
                ChatMessage(
                    role="assistant",
                    content=ai_response,
                    timestamp=datetime.now()
                )
            )
            
        except Exception as e:
            logger.error(f"Error saving chat message: {e}")
    
    async def get_chat_history(self, book_id: str, user_id: str) -> List[ChatMessage]:
        """Get chat history for a specific book"""
        try:
            chat_key = f"{book_id}_{user_id}"
            return self.chat_histories.get(chat_key, [])
        except Exception as e:
            logger.error(f"Error getting chat history: {e}")
            raise
    
    async def delete_book(self, book_id: str, user_id: str):
        """Delete a book and its associated data"""
        try:
            if book_id not in self.books_db:
                raise ValueError("Book not found")
            
            book = self.books_db[book_id]
            if book.user_id != user_id:
                raise ValueError("Unauthorized access to book")
            
            # Delete from Pinecone (delete vectors with book_id filter)
            # Note: This requires the Pinecone index to support deletion by metadata
            # In a production environment, you'd want to track vector IDs
            
            # Delete book metadata
            del self.books_db[book_id]
            
            # Delete chat history
            chat_key = f"{book_id}_{user_id}"
            if chat_key in self.chat_histories:
                del self.chat_histories[chat_key]
            
            logger.info(f"Successfully deleted book: {book_id}")
            
        except Exception as e:
            logger.error(f"Error deleting book: {e}")
            raise 
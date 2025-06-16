import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ChatInterface = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [book, setBook] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchBookInfo();
    fetchChatHistory();
  }, [bookId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchBookInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/books?user_id=${user?.id || 'demo_user'}`);
      const data = await response.json();
      const foundBook = data.books?.find(b => b.id === bookId);
      setBook(foundBook);
    } catch (error) {
      console.error('Error fetching book info:', error);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat-history/${bookId}?user_id=${user?.id || 'demo_user'}`);
      const data = await response.json();
      setMessages(data.chat_history || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          book_id: bookId,
          message: userMessage,
          user_id: user?.id || 'demo_user',
          chat_history: messages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add AI response to chat
      const aiMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        sources: data.sources
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const newChat = () => {
    setMessages([]);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading book...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-gray-900 transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-16'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
            {sidebarOpen && (
              <button
                onClick={newChat}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                New Chat
              </button>
            )}
          </div>

          {sidebarOpen && (
            <div>
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-2">Current Book</h3>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-white text-sm font-medium">{book.title}</p>
                  <p className="text-gray-400 text-xs">{book.filename}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-white font-semibold mb-2">Chat History</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {messages.filter(m => m.role === 'user').map((message, index) => (
                    <div key={index} className="bg-gray-800 p-2 rounded text-gray-300 text-sm cursor-pointer hover:bg-gray-700">
                      {message.content.substring(0, 50)}{message.content.length > 50 ? '...' : ''}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Chat with {book.title}</h1>
              <p className="text-gray-600 text-sm">Ask questions about your book content</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Start a conversation</h2>
              <p className="text-gray-500">Ask me anything about "{book.title}"</p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button
                  onClick={() => setInputMessage("What is this book about?")}
                  className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                >
                  <p className="font-medium text-blue-800">📖 What is this book about?</p>
                  <p className="text-blue-600 text-sm mt-1">Get a summary of the book's content</p>
                </button>
                <button
                  onClick={() => setInputMessage("Can you explain the main concepts?")}
                  className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
                >
                  <p className="font-medium text-purple-800">🧠 Explain key concepts</p>
                  <p className="text-purple-600 text-sm mt-1">Learn about important topics covered</p>
                </button>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`max-w-3xl px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-600 mb-2">Sources:</p>
                    {message.sources.map((source, sourceIndex) => (
                      <div key={sourceIndex} className="text-sm bg-gray-50 p-2 rounded mb-2">
                        <p className="text-gray-700">{source.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-xs opacity-75 mt-2">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border rounded-lg px-4 py-3 max-w-3xl">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about the book..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 
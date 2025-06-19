import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../ThemeToggle';
import MCQGenerator from './MCQGenerator';

const ChatInterface = ({ isDarkTheme = false, onThemeToggle }) => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [book, setBook] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  const [isMobile, setIsMobile] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showMCQGenerator, setShowMCQGenerator] = useState(false);

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchBookInfo();
    loadAllConversations();
  }, [bookId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle mobile detection and sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true); // Auto-open on desktop
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const loadAllConversations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat-history/${bookId}?user_id=${user?.id || 'demo_user'}`);
      const data = await response.json();
      const allMessages = data.chat_history || [];
      
      if (allMessages.length > 0) {
        // Group messages into conversations (for now, treat all as one conversation)
        // In future, you could implement conversation sessions
        const conversationTitle = allMessages.find(m => m.role === 'user')?.content || 'New conversation';
        const shortTitle = conversationTitle.length > 40 
          ? conversationTitle.substring(0, 40) + '...' 
          : conversationTitle;
        
        setConversationHistory([{
          id: 'current',
          title: shortTitle,
          messageCount: allMessages.filter(m => m.role === 'user').length,
          startDate: allMessages[0]?.timestamp,
          messages: allMessages
        }]);
        
        setMessages(allMessages);
        setCurrentConversationId('current');
      }
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

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    // If this is the first message, create a new conversation entry
    if (messages.length === 0) {
      const shortTitle = userMessage.length > 40 
        ? userMessage.substring(0, 40) + '...' 
        : userMessage;
      
      const newConversation = {
        id: 'current',
        title: shortTitle,
        messageCount: 1,
        startDate: new Date().toISOString(),
        messages: updatedMessages
      };
      
      setConversationHistory([newConversation]);
      setCurrentConversationId('current');
    }

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

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      
      // Update conversation history
      setConversationHistory(prev => 
        prev.map(conv => 
          conv.id === 'current' 
            ? { ...conv, messages: finalMessages, messageCount: finalMessages.filter(m => m.role === 'user').length }
            : conv
        )
      );
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date().toISOString()
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
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
    // Save current conversation to history if it has messages
    if (messages.length > 0) {
      const conversationTitle = messages.find(m => m.role === 'user')?.content || 'New conversation';
      const shortTitle = conversationTitle.length > 40 
        ? conversationTitle.substring(0, 40) + '...' 
        : conversationTitle;
      
      const savedConversation = {
        id: `conv_${Date.now()}`,
        title: shortTitle,
        messageCount: messages.filter(m => m.role === 'user').length,
        startDate: messages[0]?.timestamp,
        messages: [...messages]
      };
      
      setConversationHistory(prev => [savedConversation, ...prev.filter(c => c.id !== 'current')]);
    }
    
    // Start fresh conversation
    setMessages([]);
    setCurrentConversationId(null);
  };

  const loadConversation = (conversation) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
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
    <div className={`min-h-screen flex ${
      isDarkTheme 
        ? 'bg-gray-950' 
        : 'bg-gray-50'
    }`}>
      {/* MCQ Generator - Full Screen */}
      {showMCQGenerator && (
        <MCQGenerator 
          book={book} 
          onClose={() => setShowMCQGenerator(false)} 
          isDarkTheme={isDarkTheme} 
        />
      )}

      {/* Only show main interface when MCQ generator is not active */}
      {!showMCQGenerator && (
        <>
          {/* Mobile Sidebar Overlay */}
          {isMobile && sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

      {/* Sidebar */}
          <div className={`${
            isDarkTheme ? 'bg-[#1A1A1A] border-[#2C2C33]' : 'bg-[#FAFAFA] border-gray-200'
          } border-r transition-all duration-300 ${
            isMobile 
              ? `fixed top-0 left-0 h-full z-50 ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`
              : sidebarOpen ? 'w-72' : 'w-16'
          }`}>
        <div className="p-4">
              <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkTheme 
                      ? 'text-[#8E8EA0] hover:text-[#ECECEC] hover:bg-[#2C2C33]' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                  </svg>
            </button>
            {sidebarOpen && (
              <button
                onClick={newChat}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDarkTheme 
                        ? 'bg-[#2C2C33] text-[#ECECEC] hover:bg-[#353540]' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
              >
                New Chat
              </button>
            )}
          </div>

          {sidebarOpen && (
                <div className="space-y-6">
            <div>
                    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                      isDarkTheme ? 'text-[#8E8EA0]' : 'text-gray-500'
                    }`}>Current Book</h3>
                    <div className={`p-3 rounded-lg border ${
                      isDarkTheme 
                        ? 'bg-[#2C2C33]/50 border-[#424242]' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <p className={`font-medium text-sm mb-1 ${
                        isDarkTheme ? 'text-[#ECECEC]' : 'text-gray-900'
                      }`}>{book.title}</p>
                      <p className={`text-xs ${
                        isDarkTheme ? 'text-[#8E8EA0]' : 'text-gray-500'
                      }`}>{book.filename}</p>
                </div>
              </div>

                  <div>
                    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                      isDarkTheme ? 'text-[#8E8EA0]' : 'text-gray-500'
                    }`}>Recent Conversations</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {conversationHistory.length > 0 ? (
                    conversationHistory.map((conversation) => (
                      <div 
                        key={conversation.id}
                        onClick={() => loadConversation(conversation)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          currentConversationId === conversation.id 
                                ? isDarkTheme
                                  ? 'bg-gray-600 text-white' 
                                  : 'bg-gray-200 text-gray-900 border border-gray-300'
                                : isDarkTheme
                                  ? 'hover:bg-[#2C2C33] text-[#ECECEC]'
                                  : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                            <div className="font-medium text-sm mb-1 truncate">
                          {conversation.title}
                        </div>
                            <div className={`text-xs ${
                              currentConversationId === conversation.id 
                                ? 'opacity-80' 
                                : isDarkTheme ? 'text-[#8E8EA0]' : 'text-gray-500'
                            }`}>
                              {conversation.messageCount} questions
                        </div>
                      </div>
                    ))
                  ) : (
                        <div className={`text-center py-6 ${
                          isDarkTheme ? 'text-[#8E8EA0]' : 'text-gray-400'
                        }`}>
                          <p className="text-sm">No conversations yet</p>
                    </div>
                  )}
                </div>
              </div>

                  <div className={`pt-4 border-t ${
                    isDarkTheme ? 'border-[#424242]' : 'border-gray-200'
                  }`}>
              <button
                onClick={() => navigate('/dashboard')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDarkTheme 
                          ? 'text-[#8E8EA0] hover:text-[#ECECEC] hover:bg-[#2C2C33]' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
              >
                      ← Back to Dashboard
              </button>
                  </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`border-b px-4 md:px-6 py-3 md:py-4 ${
          isDarkTheme 
            ? 'bg-[#212121] border-[#2C2C33]' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`md:hidden p-2 rounded-lg transition-colors ${
                    isDarkTheme 
                      ? 'text-[#8E8EA0] hover:text-[#ECECEC] hover:bg-[#2C2C33]' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <div>
                  <h1 className={`text-lg md:text-xl font-semibold ${
                    isDarkTheme ? 'text-white' : 'text-gray-900'
                  }`}>{book.title}</h1>
                  <p className={`text-xs md:text-sm ${
                    isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                  }`}>Ask questions about your book content</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <ThemeToggle isDark={isDarkTheme} onToggle={onThemeToggle} />
                <button
                  onClick={() => setShowMCQGenerator(true)}
                  className="mcq-generate-btn hidden sm:block"
                  style={{
                    '--color': isDarkTheme ? '#8E8EA0' : '#6B7280',
                    '--color2': isDarkTheme ? 'rgb(236, 236, 236)' : 'rgb(31, 41, 55)',
                  }}
                >
                  Generate MCQs
                </button>
                {/* Mobile MCQ Button */}
                <button
                  onClick={() => setShowMCQGenerator(true)}
                  className={`sm:hidden p-2 rounded-lg transition-colors ${
                    isDarkTheme 
                      ? 'bg-[#424242] text-[#ECECEC] hover:bg-[#535353]' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </button>
              </div>
            </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto ${
              isDarkTheme ? 'bg-[#212121]' : 'bg-gray-50'
            }`}>
                              <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
                            {messages.length === 0 ? (
              <div className="text-center py-6">
                <div className="max-w-2xl mx-auto">
                  {/* Large Centered Robot Image */}
                  <div className="mb-6 md:mb-8">
                    <img 
                      src="/Chatimage.png" 
                      alt="AI Chat Assistant" 
                      className="w-32 h-32 md:w-40 md:h-40 mx-auto object-contain"
                    />
                  </div>
                  
                  <h2 className={`text-2xl md:text-3xl font-bold mb-3 md:mb-4 ${
                    isDarkTheme 
                      ? 'text-[#ECECEC]' 
                      : 'text-gray-900'
                  }`}>Welcome to AI Chat</h2>
                  <p className={`text-lg md:text-xl mb-6 md:mb-10 px-4 ${
                    isDarkTheme ? 'text-[#8E8EA0]' : 'text-gray-600'
                  }`}>Get started by asking a question about <span className={`font-semibold ${isDarkTheme ? 'text-[#2F80ED]' : 'text-blue-500'}`}>"{book.title}"</span></p>
                  
                                    <div className="max-w-lg mx-auto px-4">
                    <button
                      onClick={() => setInputMessage("What is this book about?")}
                      className={`w-full p-3 md:p-4 rounded-xl text-left transition-all duration-200 hover:scale-105 ${
                        isDarkTheme 
                          ? 'bg-[#2C2C33] border border-[#424242] hover:bg-[#353540] hover:border-[#4A4A55] text-[#ECECEC]' 
                          : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-700 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isDarkTheme ? 'bg-[#2F80ED]/20' : 'bg-blue-50'
                        }`}>
                          <svg className={`w-5 h-5 ${isDarkTheme ? 'text-[#2F80ED]' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold mb-1">What is this book about?</div>
                          <div className={`text-sm ${isDarkTheme ? 'text-[#8E8EA0]' : 'text-gray-500'}`}>
                            Get a comprehensive summary of the book's content
                          </div>
                        </div>
                      </div>
                    </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    {messages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3xl ${message.role === 'user' ? 'ml-4 md:ml-12' : 'mr-4 md:mr-12'}`}>
                          {message.role === 'assistant' && (
                            <div className="flex items-center mb-2">
                              <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center ${
                                isDarkTheme ? 'bg-[#424242]' : 'bg-gray-200'
                              }`}>
                                <svg className={`w-3 h-3 ${isDarkTheme ? 'text-[#8E8EA0]' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                </svg>
                              </div>
                              <span className={`text-sm font-medium ${isDarkTheme ? 'text-[#8E8EA0]' : 'text-gray-500'}`}>
                                AI Assistant
                              </span>
                            </div>
                          )}
                                                <div className={`p-3 md:p-4 rounded-xl ${
                  message.role === 'user'
                          ? isDarkTheme
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-500 text-white'
                    : isDarkTheme
                            ? 'bg-[#2C2C33] text-[#ECECEC] border border-[#424242]'
                            : 'bg-gray-100 text-gray-900 border border-gray-200'
                      }`}>
                            <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm font-medium mb-2">Sources:</p>
                    {message.sources.map((source, sourceIndex) => (
                      <div key={sourceIndex} className="text-sm bg-gray-50 p-2 rounded mb-2">
                                    <p>{source.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                          </div>
                          <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'} ${
                            isDarkTheme ? 'text-[#8E8EA0]' : 'text-gray-400'
                          }`}>
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
                      <div className="flex justify-start">
                        <div className="mr-4 md:mr-12 max-w-3xl">
                          <div className="flex items-center mb-2">
                            <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center ${
                              isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              <svg className={`w-3 h-3 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                              </svg>
                            </div>
                            <span className={`text-sm font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                              AI Assistant
                            </span>
                          </div>
                                                <div className={`p-4 rounded-xl border ${
                isDarkTheme 
                          ? 'bg-[#2C2C33] border-[#424242]' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className={`text-sm ${isDarkTheme ? 'text-[#8E8EA0]' : 'text-gray-600'}`}>
                                Thinking...
                              </span>
                            </div>
                </div>
              </div>
            </div>
          )}
                  </div>
                )}
              </div>
        </div>

        {/* Input Area */}
        <div className={`border-t p-3 md:p-4 ${
          isDarkTheme 
            ? 'bg-[#212121] border-[#2C2C33]' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className={`relative rounded-xl md:rounded-2xl border-2 transition-all duration-200 ${
                isDarkTheme 
                  ? 'bg-[#2C2C33] border-[#424242] focus-within:border-[#2F80ED]' 
                  : 'bg-gray-50 border-gray-200 focus-within:border-blue-400'
              } shadow-lg focus-within:shadow-xl`}>
                <div className="flex items-end p-2 md:p-3">
                  {/* Attachment Button */}
                  <button className={`p-2 md:p-3 rounded-xl md:rounded-2xl mr-2 md:mr-3 transition-colors ${
                    isDarkTheme 
                      ? 'text-[#8E8EA0] hover:text-[#ECECEC] hover:bg-[#424242]' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                  }`}>
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  
                  {/* Input Field */}
                  <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                      placeholder="Ask me anything..."
                      className={`w-full bg-transparent resize-none focus:outline-none text-base md:text-lg leading-relaxed ${
                    isDarkTheme 
                          ? 'text-[#ECECEC] placeholder-[#8E8EA0]' 
                          : 'text-gray-900 placeholder-gray-500'
                  }`}
                      rows="1"
                  disabled={isLoading}
                      style={{ minHeight: '28px', maxHeight: '120px' }}
                />
              </div>
                  
                  {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                    className={`ml-2 md:ml-3 p-2 md:p-3 rounded-xl md:rounded-2xl transition-all duration-200 flex items-center justify-center ${
                      !inputMessage.trim() || isLoading
                        ? isDarkTheme
                          ? 'bg-[#424242] text-[#8E8EA0] cursor-not-allowed'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : isDarkTheme
                          ? 'bg-[#2F80ED] text-white hover:bg-[#1E6ADB] shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                    }`}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-current"></div>
                    ) : (
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Bottom Actions */}
                <div className="flex items-center justify-between px-3 md:px-4 pb-2 md:pb-3">
                  <div className="flex items-center space-x-2 md:space-x-3 text-xs">
                    <button className={`hidden md:flex items-center space-x-1 transition-colors ${
                      isDarkTheme 
                        ? 'text-[#8E8EA0] hover:text-[#ECECEC]' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span>Voice Message</span>
                    </button>
                    <button className={`hidden md:flex items-center space-x-1 transition-colors ${
                      isDarkTheme 
                        ? 'text-[#8E8EA0] hover:text-[#ECECEC]' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <span>Browse Prompts</span>
              </button>
                  </div>
                  <div className={`text-xs ${
                    isDarkTheme ? 'text-[#8E8EA0]' : 'text-gray-400'
                  }`}>
                    {inputMessage.length}/2000
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default ChatInterface; 
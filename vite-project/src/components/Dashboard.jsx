import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AnimatedFileUpload from './AnimatedFileUpload';
import WebScraper from './WebScraper';
import Loader from './Loader';

const Dashboard = ({ isDarkTheme = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [books, setBooks] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [bookName, setBookName] = useState('');
  const [uploadType, setUploadType] = useState('file');
  const [supportedFormats, setSupportedFormats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchBooks();
    fetchSupportedFormats();
  }, []);

  const fetchBooks = async () => {
    try {
      setIsLoadingBooks(true);
      const response = await fetch(`${API_BASE_URL}/books?user_id=${user?.id || 'demo_user'}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      setBooks(data.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchSupportedFormats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/supported-formats`);
      if (response.ok) {
        const data = await response.json();
        setSupportedFormats(data.supported_formats);
      }
    } catch (error) {
      console.error('Error fetching supported formats:', error);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('File size too large. Maximum 50MB allowed.');
      return;
    }

    const fileName = file.name;
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    setSelectedFile(file);
    setBookName(nameWithoutExt);
    setUploadType('file');
    setShowUploadModal(true);
  };

  const handleWebScrape = async (url, title = null) => {
    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 300);

    try {
      const userId = user?.id || 'demo_user';
      
      const response = await fetch(`${API_BASE_URL}/scrape-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title, user_id: userId })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Web scraping failed' }));
        throw new Error(errorData.detail || 'Web scraping failed');
      }

      const result = await response.json();
      setUploadProgress(100);
      
      setTimeout(async () => {
        await fetchBooks();
        alert(`Web content "${result.url}" scraped successfully!`);
      }, 500);
      
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error scraping web content:', error);
      alert(`Error scraping web content: ${error.message}`);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !bookName.trim()) {
      alert('Please provide a book name');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setShowUploadModal(false);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const userId = user?.id || 'demo_user';
      const params = new URLSearchParams({
        user_id: userId,
        book_name: bookName.trim()
      });
      
      const response = await fetch(`${API_BASE_URL}/upload-book?${params}`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      setUploadProgress(100);
      
      setTimeout(async () => {
        await fetchBooks();
        alert(`Book "${result.book_name}" uploaded successfully!`);
      }, 500);
      
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error uploading book:', error);
      alert(`Error uploading book: ${error.message}`);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        setBookName('');
      }, 1000);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const openBookChat = (bookId) => {
    navigate(`/chat/${bookId}`);
  };

  const deleteBook = async (bookId, bookTitle) => {
    if (!confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/book/${bookId}?user_id=${user?.id || 'demo_user'}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      await fetchBooks();
      alert('Book deleted successfully!');
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Error deleting book. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkTheme 
        ? 'bg-gradient-to-br from-gray-900 to-blue-900' 
        : 'bg-gradient-to-br from-gray-50 to-blue-50'
    }`}>
      <div className="container mx-auto px-4 py-6">
        <div className={`rounded-2xl shadow-lg p-6 mb-6 transition-colors duration-300 ${
          isDarkTheme ? 'bg-gray-800/90 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm'
        }`}>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
            <div>
              <h1 className={`text-3xl lg:text-4xl font-bold mb-2 transition-colors duration-300 ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>AI Tutor Dashboard</h1>
              <p className={`text-base transition-colors duration-300 ${
                isDarkTheme ? 'text-gray-300' : 'text-gray-600'
              }`}>Welcome back, {user?.email}!</p>
            </div>
            
            <div className="flex space-x-6 mt-4 lg:mt-0">
              <div className="text-center">
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkTheme ? 'text-blue-400' : 'text-blue-600'
                }`}>{books.length}</div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                }`}>Total Books</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkTheme ? 'text-green-400' : 'text-green-600'
                }`}>
                  {books.filter(book => new Date(book.upload_date) > new Date(Date.now() - 7*24*60*60*1000)).length}
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                }`}>This Week</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1 space-y-6">
            <div className={`rounded-2xl shadow-lg p-6 transition-colors duration-300 ${
              isDarkTheme ? 'bg-gray-800/90 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm'
            }`}>
              <h2 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
                isDarkTheme ? 'text-white' : 'text-gray-800'
              }`}>📚 Add Content</h2>
              
              <div className="flex mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setUploadType('file')}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                    uploadType === 'file'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  📁 Files
                </button>
                <button
                  onClick={() => setUploadType('web')}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                    uploadType === 'web'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  🌐 Web
                </button>
              </div>
              
              <div
                className={`rounded-lg p-4 text-center transition-colors duration-300 ${
                  dragActive 
                    ? 'bg-blue-50 dark:bg-blue-900/30' 
                    : isDarkTheme 
                      ? 'bg-gray-700/50' 
                      : 'bg-gray-50/50'
                } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.pptx,.ppt,.txt,.md,.json,.png,.jpg,.jpeg,.html,.htm"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                
                {isUploading ? (
                  <div>
                    <div className="flex justify-center mb-3">
                      <Loader size={40} color="#3B82F6" />
                    </div>
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                    }`}>Uploading...</p>
                    <div className={`w-full rounded-full h-2 mt-3 transition-colors duration-300 ${
                      isDarkTheme ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : uploadType === 'file' ? (
                  <AnimatedFileUpload 
                    onFileSelect={handleFileSelect}
                    disabled={isUploading}
                    isDarkTheme={isDarkTheme}
                  />
                ) : (
                  <WebScraper
                    onWebScrape={handleWebScrape}
                    disabled={isUploading}
                    isDarkTheme={isDarkTheme}
                  />
                )}
              </div>
            </div>


          </div>

          <div className="xl:col-span-3">
            <div className={`rounded-2xl shadow-lg p-6 transition-colors duration-300 ${
              isDarkTheme ? 'bg-gray-800/90 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm'
            }`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                <h2 className={`text-2xl font-bold mb-4 sm:mb-0 transition-colors duration-300 ${
                  isDarkTheme ? 'text-white' : 'text-gray-800'
                }`}>📚 Content Library</h2>
                
                {books.length > 0 && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search your books..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                        isDarkTheme 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <div className="absolute left-3 top-2.5">
                      <svg className={`w-5 h-5 transition-colors duration-300 ${
                        isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              
              {isLoadingBooks ? (
                <div className="flex justify-center items-center py-20">
                  <div className="text-center">
                    <Loader size={60} />
                    <p className={`mt-4 text-lg transition-colors duration-300 ${
                      isDarkTheme ? 'text-gray-300' : 'text-gray-600'
                    }`}>Loading your library...</p>
                  </div>
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className={`text-center py-16 rounded-xl transition-colors duration-300 ${
                  isDarkTheme ? 'bg-gray-700/50' : 'bg-gray-50/50'
                }`}>
                  <div className="text-6xl mb-4">
                    {books.length === 0 ? '📚' : '🔍'}
                  </div>
                  <p className={`text-xl font-medium mb-2 transition-colors duration-300 ${
                    isDarkTheme ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {books.length === 0 ? 'No content yet' : 'No matches found'}
                  </p>
                  <p className={`transition-colors duration-300 ${
                    isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {books.length === 0 
                      ? 'Upload a document or scrape web content to get started!' 
                      : `Try searching for something else in your ${books.length} books`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {filteredBooks.map((book) => (
                    <div key={book.id} className={`border rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 group ${
                      isDarkTheme 
                        ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
                        : 'bg-white/50 border-gray-200 hover:bg-white'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold mb-2 line-clamp-2 text-base transition-colors duration-300 ${
                            isDarkTheme ? 'text-white' : 'text-gray-900'
                          }`}>{book.title}</h3>
                          <p className={`text-sm mb-1 truncate transition-colors duration-300 ${
                            isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                          }`}>{book.filename}</p>
                          <p className={`text-xs transition-colors duration-300 ${
                            isDarkTheme ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            📅 {new Date(book.upload_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openBookChat(book.id)}
                            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                            title="Chat with this book"
                          >
                            💬
                          </button>
                          <button
                            onClick={() => deleteBook(book.id, book.title)}
                            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                            title="Delete book"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => openBookChat(book.id)}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
                      >
                        🚀 Start Learning
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-2xl p-8 max-w-md w-full mx-4 transition-colors duration-300 ${
            isDarkTheme ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>Add New Content</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Selected File
                </label>
                <p className={`p-3 rounded-lg transition-colors duration-300 ${
                  isDarkTheme 
                    ? 'text-gray-300 bg-gray-700' 
                    : 'text-gray-600 bg-gray-50'
                }`}>
                  📄 {selectedFile?.name}
                </p>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Content Name *
                </label>
                <input
                  type="text"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  placeholder="Enter a name for this content"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                    isDarkTheme 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  autoFocus
                />
                <p className={`text-sm mt-1 transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  This name will be used in your library and for organizing your content
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setBookName('');
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors duration-300 ${
                  isDarkTheme 
                    ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!bookName.trim()}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 
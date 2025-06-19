import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AnimatedFileUpload from './AnimatedFileUpload';

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

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      console.log('Fetching books for user:', user?.id || 'demo_user');
      console.log('API URL:', `${API_BASE_URL}/books?user_id=${user?.id || 'demo_user'}`);
      
      const response = await fetch(`${API_BASE_URL}/books?user_id=${user?.id || 'demo_user'}`);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Books data received:', data);
      setBooks(data.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
  };

  const handleFileSelect = (file) => {
    if (!file || !file.type.includes('pdf')) {
      alert('Please select a PDF file');
      return;
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size too large. Maximum 50MB allowed.');
      return;
    }

    setSelectedFile(file);
    setBookName(file.name.replace('.pdf', '')); // Default book name from filename
    setShowUploadModal(true);
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !bookName.trim()) {
      alert('Please provide a book name');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setShowUploadModal(false);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Send user_id and book_name as query parameters
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
      
      // Wait a bit to show completed progress
      setTimeout(async () => {
        // Refresh books list
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
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
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
    <div className={`min-h-screen py-4 md:py-8 transition-colors duration-300 ${
      isDarkTheme 
        ? 'bg-gradient-to-br from-gray-900 to-blue-900' 
        : 'bg-gradient-to-br from-gray-50 to-blue-50'
    }`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className={`rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8 max-w-6xl mx-auto transition-colors duration-300 ${
          isDarkTheme ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8">
            <div className="mb-4 md:mb-0">
              <h1 className={`text-2xl md:text-4xl font-bold mb-2 transition-colors duration-300 ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>AI Tutor Dashboard</h1>
              <p className={`text-sm md:text-base transition-colors duration-300 ${
                isDarkTheme ? 'text-gray-300' : 'text-gray-600'
              }`}>Upload your books and start learning, {user?.email}!</p>
            </div>
          </div>
          
          {/* Upload Section */}
          <div className="mb-8 md:mb-12">
            <h2 className={`text-xl md:text-2xl font-bold mb-4 md:mb-6 transition-colors duration-300 ${
              isDarkTheme ? 'text-white' : 'text-gray-800'
            }`}>Upload Your Books</h2>
            
            <div
              className={`rounded-lg md:rounded-xl p-4 md:p-8 text-center transition-colors duration-300 ${
                dragActive 
                  ? 'bg-blue-50 dark:bg-blue-900/30' 
                  : isDarkTheme 
                    ? 'bg-gray-800/50' 
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
                accept=".pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              <div className="space-y-4">
                {isUploading ? (
                  <div>
                    <div className="text-6xl mb-4">📚</div>
                    <p className={`text-lg font-medium transition-colors duration-300 ${
                      isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                    }`}>Uploading...</p>
                    <div className={`w-full rounded-full h-2 mt-4 transition-colors duration-300 ${
                      isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div>
                  
                    <div className="flex justify-center">
                      <AnimatedFileUpload 
                        onFileSelect={handleFileSelect}
                        disabled={isUploading}
                        isDarkTheme={isDarkTheme}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Books Library */}
          <div>
            <h2 className={`text-xl md:text-2xl font-bold mb-4 md:mb-6 transition-colors duration-300 ${
              isDarkTheme ? 'text-white' : 'text-gray-800'
            }`}>Your Book Library</h2>
            
            {books.length === 0 ? (
              <div className={`text-center py-8 md:py-12 rounded-lg md:rounded-xl transition-colors duration-300 ${
                isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="text-6xl mb-4">📖</div>
                <p className={`text-lg transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-300' : 'text-gray-600'
                }`}>No books uploaded yet</p>
                <p className={`transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                }`}>Upload your first PDF to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {books.map((book) => (
                  <div key={book.id} className={`border rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 ${
                    isDarkTheme 
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold mb-2 line-clamp-2 text-sm md:text-base transition-colors duration-300 ${
                          isDarkTheme ? 'text-white' : 'text-gray-900'
                        }`}>{book.title}</h3>
                        <p className={`text-xs md:text-sm mb-1 transition-colors duration-300 ${
                          isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                        }`}>{book.filename}</p>
                        <p className={`text-xs transition-colors duration-300 ${
                          isDarkTheme ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          Uploaded: {new Date(book.upload_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-1 md:space-x-2 ml-2">
                        <button
                          onClick={() => openBookChat(book.id)}
                          className="bg-blue-600 text-white p-1.5 md:p-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          title="Chat with this book"
                        >
                          💬
                        </button>
                        <button
                          onClick={() => deleteBook(book.id, book.title)}
                          className="bg-red-600 text-white p-1.5 md:p-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                          title="Delete book"
                        >
                          🗑️
                        </button>
                      </div>
            </div>
            
                    <div className="mt-4">
                      <button
                        onClick={() => openBookChat(book.id)}
                        className="w-full bg-purple-600 text-white py-2 md:py-3 px-4 rounded-lg text-sm md:text-base font-medium hover:bg-purple-700 transition-colors"
                      >
                        Start Learning
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </div>
            
        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-2xl p-8 max-w-md w-full mx-4 transition-colors duration-300 ${
              isDarkTheme ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>Add New Book</h3>
              
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
                      Book Name *
                    </label>
                    <input
                      type="text"
                      value={bookName}
                      onChange={(e) => setBookName(e.target.value)}
                      placeholder="Enter a name for this book"
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
                      This name will be used in your library and for organizing your book data
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
                    Upload Book
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 
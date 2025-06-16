import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [books, setBooks] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/books?user_id=${user?.id || 'demo_user'}`);
      const data = await response.json();
      setBooks(data.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file || !file.type.includes('pdf')) {
      alert('Please select a PDF file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user?.id || 'demo_user');

      const response = await fetch(`${API_BASE_URL}/upload-book`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadProgress(100);
      
      // Refresh books list
      await fetchBooks();
      
      alert('Book uploaded successfully!');
    } catch (error) {
      console.error('Error uploading book:', error);
      alert('Error uploading book. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Tutor Dashboard</h1>
              <p className="text-gray-600">Upload your books and start learning, {user?.email}!</p>
            </div>
          </div>

          {/* Upload Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Your Books</h2>
            
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
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
                <div className="text-6xl">📚</div>
                
                {isUploading ? (
                  <div>
                    <p className="text-lg font-medium text-gray-700">Uploading...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Drag and drop your PDF here, or click to browse
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Choose PDF File
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Books Library */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Book Library</h2>
            
            {books.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="text-6xl mb-4">📖</div>
                <p className="text-gray-600 text-lg">No books uploaded yet</p>
                <p className="text-gray-500">Upload your first PDF to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => (
                  <div key={book.id} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{book.title}</h3>
                        <p className="text-sm text-gray-500 mb-1">{book.filename}</p>
                        <p className="text-xs text-gray-400">
                          Uploaded: {new Date(book.upload_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openBookChat(book.id)}
                          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                          title="Chat with this book"
                        >
                          💬
                        </button>
                        <button
                          onClick={() => deleteBook(book.id, book.title)}
                          className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                          title="Delete book"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        onClick={() => openBookChat(book.id)}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
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
      </div>
    </div>
  );
};

export default Dashboard; 
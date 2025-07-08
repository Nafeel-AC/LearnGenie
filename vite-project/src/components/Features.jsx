import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';

const Features = ({ isDarkTheme = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [supportedFormats, setSupportedFormats] = useState([]);

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchSupportedFormats();
  }, []);

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

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Learning',
      category: 'Intelligence',
      description: 'Advanced AI that understands your documents and provides intelligent responses to help you learn faster.',
      details: 'Natural language processing with context-aware responses and personalized learning paths for smart content summarization.',
      color: '#ff9966'
    },
    {
      icon: '📚',
      title: 'Multi-Format Support',
      category: 'Compatibility',
      description: 'Upload various document types and web content for comprehensive learning material management.',
      details: 'Support for PDF, DOCX, TXT, spreadsheets, presentations, images, web content, markdown and JSON files.',
      color: '#66ff99'
    },
    {
      icon: '🌐',
      title: 'Web Scraping',
      category: 'Integration',
      description: 'Powerful web scraping with Firecrawl integration for extracting clean, structured content.',
      details: 'Advanced content extraction with SEO metadata preservation and clean markdown output optimized for LLMs.',
      color: '#9966ff'
    },
    {
      icon: '💬',
      title: 'Interactive Chat',
      category: 'Interface',
      description: 'Engage in natural conversations with your documents through our intuitive chat interface.',
      details: 'Real-time responses with context preservation, multi-document conversations and chat history export.',
      color: '#ff6699'
    },
    {
      icon: '🧠',
      title: 'MCQ Generation',
      category: 'Assessment',
      description: 'Automatically generate multiple-choice questions from your content to test understanding.',
      details: 'Automatic question creation with difficulty adjustment, instant feedback and progress tracking.',
      color: '#66ffff'
    },
    {
      icon: '🎯',
      title: 'Vector Search',
      category: 'Search',
      description: 'Powered by Pinecone vector database for lightning-fast semantic search.',
      details: 'Semantic similarity search with instant retrieval, cross-document connections and advanced embeddings.',
      color: '#ffff66'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      category: 'Security',
      description: 'Your data is protected with enterprise-grade security and privacy measures.',
      details: 'End-to-end encryption with secure cloud storage, privacy-first design and GDPR compliance.',
      color: '#ff9999'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      category: 'Performance',
      description: 'Optimized performance for instant responses and seamless user experience.',
      details: 'Sub-second response times with efficient caching, optimized embeddings and scalable architecture.',
      color: '#99ff99'
    }
  ];

  const FeatureCard = ({ feature, isDark }) => {
    return (
      <StyledWrapper isDark={isDark}>
        <div className="card">
          <div className="content">
            <div className="back">
              <div className="back-content" style={{ '--gradient-color': feature.color }}>
                <strong style={{ fontSize: '18px', marginBottom: '15px', textAlign: 'center' }}>
                  {feature.title}
                </strong>
                <p style={{ textAlign: 'center', fontSize: '14px', margin: '0', lineHeight: '1.4' }}>
                  {feature.details}
                </p>
              </div>
            </div>
            <div className="front">
              <div className="img">
                <div className="circle" style={{ backgroundColor: feature.color }}>
                </div>
                <div className="circle" id="right" style={{ backgroundColor: feature.color }}>
                </div>
                <div className="circle" id="bottom" style={{ backgroundColor: feature.color }}>
                </div>
              </div>
              <div className="front-content">
                <div className="main-content">
                  <div className="badge">{feature.category}</div>
                  <h3 className="card-title">
                    {feature.title}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StyledWrapper>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkTheme 
        ? 'bg-gradient-to-br from-gray-900 to-blue-900' 
        : 'bg-gradient-to-br from-gray-50 to-blue-50'
    }`}>
      {/* Header Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className={`text-5xl md:text-6xl font-bold mb-6 transition-colors duration-300 ${
            isDarkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            Powerful Features for
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {' '}Smart Learning
            </span>
          </h1>
          <p className={`text-xl md:text-2xl max-w-3xl mx-auto transition-colors duration-300 ${
            isDarkTheme ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Discover the advanced capabilities that make AI Tutor the ultimate learning companion
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} isDark={isDarkTheme} />
          ))}
        </div>

        {/* Supported Formats Section */}
        {supportedFormats && Object.keys(supportedFormats).length > 0 && (
          <div className="mt-20">
            <div className={`rounded-3xl shadow-2xl p-8 transition-colors duration-300 ${
              isDarkTheme 
                ? 'bg-gray-800/90 backdrop-blur-sm border border-gray-700' 
                : 'bg-white/90 backdrop-blur-sm border border-gray-200'
            }`}>
              <div className="text-center mb-8">
                <h2 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
                  isDarkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  📋 Supported File Formats
                </h2>
                <p className={`text-lg transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Upload any of these file types and start learning immediately
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(supportedFormats).map(([category, formats]) => (
                  <div 
                    key={category}
                    className={`p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                      isDarkTheme 
                        ? 'bg-gray-700/50 hover:bg-gray-700' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-3">
                        {category === 'documents' && '📄'}
                        {category === 'spreadsheets' && '📊'}
                        {category === 'presentations' && '📋'}
                        {category === 'images' && '🖼️'}
                        {category === 'web' && '🌐'}
                        {category === 'other' && '📎'}
                      </div>
                      <h3 className={`text-base font-bold mb-2 capitalize transition-colors duration-300 ${
                        isDarkTheme ? 'text-white' : 'text-gray-900'
                      }`}>
                        {category.replace('_', ' ')}
                      </h3>
                      <div className={`text-sm transition-colors duration-300 ${
                        isDarkTheme ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {Array.isArray(formats) ? formats.map((format, idx) => (
                          <span key={idx} className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-2 py-1 rounded-full inline-block mr-1 mb-1 text-xs">
                            {format}
                          </span>
                        )) : (
                          <span className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-2 py-1 rounded-full inline-block text-xs">
                            {formats}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-20">
          <div className={`text-center p-8 rounded-3xl shadow-2xl transition-colors duration-300 ${
            isDarkTheme 
              ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border border-gray-700' 
              : 'bg-gradient-to-r from-purple-100/50 to-blue-100/50 backdrop-blur-sm border border-gray-200'
          }`}>
            <h2 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Ready to Transform Your Learning?
            </h2>
            <p className={`text-lg mb-6 transition-colors duration-300 ${
              isDarkTheme ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Join thousands of learners who are already experiencing the power of AI-assisted education
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  📚 Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/signup')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    🚀 Start Free Trial
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                      isDarkTheme 
                        ? 'bg-gray-700 text-white hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    🔑 Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StyledWrapper = styled.div`
  .card {
    overflow: visible;
    width: 190px;
    height: 254px;
  }

  .content {
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 300ms;
    box-shadow: ${props => props.isDark 
      ? '0px 0px 10px 1px rgba(0,0,0,0.3)' 
      : '0px 0px 15px 2px rgba(0,0,0,0.15)'};
    border-radius: 5px;
  }

  .front, .back {
    background-color: ${props => props.isDark ? '#1f2937' : '#ffffff'};
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 5px;
    overflow: hidden;
    border: ${props => props.isDark ? '1px solid #374151' : '1px solid #e5e7eb'};
  }

  .back {
    width: 100%;
    height: 100%;
    justify-content: center;
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .back::before {
    position: absolute;
    content: ' ';
    display: block;
    width: 160px;
    height: 160%;
    background: linear-gradient(90deg, transparent, var(--gradient-color, #ff9966), var(--gradient-color, #ff9966), var(--gradient-color, #ff9966), var(--gradient-color, #ff9966), transparent);
    animation: rotation_481 5000ms infinite linear;
  }

  .back-content {
    position: absolute;
    width: 99%;
    height: 99%;
    background-color: ${props => props.isDark ? '#1f2937' : '#ffffff'};
    border-radius: 5px;
    color: ${props => props.isDark ? 'white' : '#1f2937'};
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 15px;
    padding: 20px;
  }

  .card:hover .content {
    transform: rotateY(180deg);
  }

  @keyframes rotation_481 {
    0% {
      transform: rotateZ(0deg);
    }

    100% {
      transform: rotateZ(360deg);
    }
  }

  .front {
    transform: rotateY(180deg);
    color: ${props => props.isDark ? 'white' : '#1f2937'};
  }

  .front .front-content {
    position: absolute;
    width: 100%;
    height: 100%;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .main-content {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .front-content .badge {
    background-color: ${props => props.isDark 
      ? 'rgba(255,255,255,0.15)' 
      : 'rgba(0,0,0,0.1)'};
    color: ${props => props.isDark ? 'white' : '#1f2937'};
    padding: 6px 16px;
    border-radius: 20px;
    backdrop-filter: blur(10px);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    border: ${props => props.isDark 
      ? '1px solid rgba(255,255,255,0.2)' 
      : '1px solid rgba(0,0,0,0.1)'};
  }

  .card-title {
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    margin: 0;
    color: ${props => props.isDark ? 'white' : '#1f2937'};
    line-height: 1.3;
    text-shadow: ${props => props.isDark 
      ? '0 2px 4px rgba(0,0,0,0.3)' 
      : '0 2px 4px rgba(255,255,255,0.8)'};
  }

  .front .img {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    opacity: ${props => props.isDark ? '0.6' : '0.3'};
  }

  .circle {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background-color: #ffbb66;
    position: relative;
    filter: blur(15px);
    animation: floating 2600ms infinite linear;
  }

  #bottom {
    background-color: #ff8866;
    left: 50px;
    top: 0px;
    width: 150px;
    height: 150px;
    animation-delay: -800ms;
  }

  #right {
    background-color: #ff2233;
    left: 160px;
    top: -80px;
    width: 30px;
    height: 30px;
    animation-delay: -1800ms;
  }

  @keyframes floating {
    0% {
      transform: translateY(0px);
    }

    50% {
      transform: translateY(10px);
    }

    100% {
      transform: translateY(0px);
    }
  }
`;

export default Features; 
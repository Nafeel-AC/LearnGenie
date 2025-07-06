import React, { useState } from 'react';
import styled from 'styled-components';

const WebScraper = ({ onWebScrape, disabled = false, isDarkTheme = false }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) return;
    
    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      alert('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    
    try {
      await onWebScrape(url.trim(), title.trim() || null);
      setUrl('');
      setTitle('');
    } catch (error) {
      console.error('Error scraping URL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledWrapper isDarkTheme={isDarkTheme}>
      <div className={`web-scraper-container ${disabled ? 'disabled' : ''} ${isDarkTheme ? 'dark' : ''}`}>
        <div className="icon-container">
          <div className="web-icon">
            <div className="globe">
              <div className="globe-lines"></div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="scraper-form">
          <div className="input-group">
            <input
              type="url"
              placeholder="Enter URL to scrape (e.g., https://example.com/article)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={disabled || isLoading}
              className="url-input"
              required
            />
          </div>
          
          <div className="input-group">
            <input
              type="text"
              placeholder="Custom title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={disabled || isLoading}
              className="title-input"
            />
          </div>
          
          <button
            type="submit"
            disabled={disabled || isLoading || !url.trim()}
            className="scrape-button"
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Scraping...
              </>
            ) : (
              <>
                <span className="button-icon">🌐</span>
                Scrape Web Content
              </>
            )}
          </button>
        </form>
        
        <div className="supported-sites">
          <small>Supports: News articles, blogs, documentation, and most web content</small>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .web-scraper-container {
    --transition: 350ms;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: ${props => props.isDarkTheme 
      ? 'linear-gradient(135deg, #4a5568, #2d3748)' 
      : 'linear-gradient(135deg, #667eea, #764ba2)'};
    border-radius: 15px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    min-height: 200px;
    position: relative;
    transition: all var(--transition) ease;
  }

  .web-scraper-container.dark {
    background: linear-gradient(135deg, #4a5568, #2d3748);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
  }

  .web-scraper-container.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .icon-container {
    margin-bottom: 15px;
  }

  .web-icon {
    animation: float 3s infinite ease-in-out;
  }

  .globe {
    width: 60px;
    height: 60px;
    border: 3px solid #ffffff;
    border-radius: 50%;
    position: relative;
    background: transparent;
  }

  .globe-lines {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    border: 2px solid #ffffff;
    border-radius: 50%;
  }

  .globe-lines::before,
  .globe-lines::after {
    content: '';
    position: absolute;
    background: #ffffff;
    border-radius: 1px;
  }

  .globe-lines::before {
    width: 2px;
    height: 100%;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
  }

  .globe-lines::after {
    width: 100%;
    height: 2px;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
  }

  .scraper-form {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
  }

  .url-input,
  .title-input {
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    transition: all var(--transition) ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .url-input:focus,
  .title-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .url-input::placeholder,
  .title-input::placeholder {
    color: #666;
  }

  .scrape-button {
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition) ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .scrape-button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  .scrape-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .button-icon {
    font-size: 18px;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .supported-sites {
    margin-top: 15px;
    text-align: center;
    color: rgba(255, 255, 255, 0.8);
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-15px);
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default WebScraper; 
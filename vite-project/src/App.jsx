import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ThemeToggle from './ThemeToggle'
import Home from './components/Home'
import Login from './components/Login'
import SignUp from './components/SignUp'
import Dashboard from './components/Dashboard'
import Profile from './components/Profile'
import ChatInterface from './components/ChatInterface'

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Check if current route is authentication page or chat page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'
  const isChatPage = location.pathname.startsWith('/chat/')

  // Apply theme to document when state changes
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkTheme])

  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkTheme 
        ? 'bg-gradient-to-br from-gray-900 to-blue-900' 
        : 'bg-gradient-to-br from-gray-50 to-blue-50'
    }`}>
      {/* Desktop Navigation - hidden on auth pages and chat pages */}
      {!isAuthPage && !isChatPage && (
        <nav className={`hidden md:flex items-center justify-between px-6 py-4 mx-6 mb-6 rounded-full shadow-lg transition-colors duration-300 ${
          isDarkTheme ? 'bg-gray-800' : 'bg-white'
        }`}>
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className={`text-xl font-bold transition-colors duration-300 ${
            isDarkTheme ? 'text-white' : 'text-gray-800'
          }`}>AITutor</span>
        </Link>

        {/* Navigation Links */}
        <div className={`flex items-center px-6 py-3 rounded-full transition-colors duration-300 ${
          isDarkTheme ? 'bg-purple-900/30' : 'bg-purple-100'
        }`}>
          <div className="flex items-center space-x-8">
            {user ? (
              // Logged in navigation
              <>
                <Link to="/dashboard" className={`font-medium transition-colors ${
                  isDarkTheme 
                    ? 'text-gray-300 hover:text-purple-300' 
                    : 'text-gray-700 hover:text-purple-700'
                }`}>
                  Dashboard
                </Link>
                <Link to="/profile" className={`font-medium transition-colors ${
                  isDarkTheme 
                    ? 'text-gray-300 hover:text-purple-300' 
                    : 'text-gray-700 hover:text-purple-700'
                }`}>
                  Profile
                </Link>
                <a href="#" className={`font-medium transition-colors ${
                  isDarkTheme 
                    ? 'text-gray-300 hover:text-purple-300' 
                    : 'text-gray-700 hover:text-purple-700'
                }`}>
                  Features
                </a>
                <a href="#" className={`font-medium transition-colors ${
                  isDarkTheme 
                    ? 'text-gray-300 hover:text-purple-300' 
                    : 'text-gray-700 hover:text-purple-700'
                }`}>
                  FAQ
                </a>
              </>
            ) : (
              // Not logged in navigation
              <>
                <Link to="/login" className={`font-medium transition-colors ${
                  isDarkTheme 
                    ? 'text-gray-300 hover:text-purple-300' 
                    : 'text-gray-700 hover:text-purple-700'
                }`}>
                  Login
                </Link>
                <a href="#" className={`font-medium transition-colors ${
                  isDarkTheme 
                    ? 'text-gray-300 hover:text-purple-300' 
                    : 'text-gray-700 hover:text-purple-700'
                }`}>
                  Features
                </a>
                <a href="#" className={`font-medium transition-colors ${
                  isDarkTheme 
                    ? 'text-gray-300 hover:text-purple-300' 
                    : 'text-gray-700 hover:text-purple-700'
                }`}>
                  FAQ
                </a>
              </>
            )}
          </div>
        </div>

          {/* Theme Toggle */}
          <ThemeToggle isDark={isDarkTheme} onToggle={handleThemeToggle} />
        </nav>
      )}

      {/* Mobile Top Bar - hidden on auth pages and chat pages */}
      {!isAuthPage && !isChatPage && (
        <div className={`md:hidden flex items-center justify-between px-4 py-3 mx-4 mb-4 rounded-xl shadow-lg transition-colors duration-300 ${
          isDarkTheme ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">AI</span>
            </div>
            <span className={`text-lg font-bold transition-colors duration-300 ${
              isDarkTheme ? 'text-white' : 'text-gray-800'
            }`}>AITutor</span>
          </Link>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2">
            <ThemeToggle isDark={isDarkTheme} onToggle={handleThemeToggle} />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkTheme 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {!isAuthPage && !isChatPage && isMobileMenuOpen && (
        <div className={`md:hidden mx-4 mb-4 rounded-xl shadow-lg transition-colors duration-300 ${
          isDarkTheme ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="p-4 space-y-2">
            {user ? (
              // Logged in navigation
              <>
                <Link 
                  to="/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${
                    isDarkTheme 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  📊 Dashboard
                </Link>
                <Link 
                  to="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${
                    isDarkTheme 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  👤 Profile
                </Link>
                <a 
                  href="#" 
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${
                    isDarkTheme 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  ⭐ Features
                </a>
                <a 
                  href="#" 
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${
                    isDarkTheme 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  ❓ FAQ
                </a>
              </>
            ) : (
              // Not logged in navigation
              <>
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${
                    isDarkTheme 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  🔑 Login
                </Link>
                <a 
                  href="#" 
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${
                    isDarkTheme 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  ⭐ Features
                </a>
                <a 
                  href="#" 
                  className={`block py-3 px-4 rounded-lg font-medium transition-colors ${
                    isDarkTheme 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  ❓ FAQ
                </a>
              </>
            )}
          </div>
        </div>
      )}

      {/* Routes */}
      <div className={`${!isAuthPage && !isChatPage ? 'pb-16 md:pb-0' : ''}`}>
        <Routes>
          <Route path="/" element={<Home isDarkTheme={isDarkTheme} />} />
          <Route path="/login" element={user ? <Dashboard isDarkTheme={isDarkTheme} /> : <Login />} />
          <Route path="/signup" element={user ? <Dashboard isDarkTheme={isDarkTheme} /> : <SignUp />} />
          <Route path="/dashboard" element={user ? <Dashboard isDarkTheme={isDarkTheme} /> : <Login />} />
          <Route path="/profile" element={user ? <Profile isDarkTheme={isDarkTheme} /> : <Login />} />
          <Route path="/chat/:bookId" element={user ? <ChatInterface isDarkTheme={isDarkTheme} onThemeToggle={handleThemeToggle} /> : <Login />} />
        </Routes>
      </div>

      {/* Mobile Bottom Navigation - hidden on auth pages and chat pages */}
      {!isAuthPage && !isChatPage && user && (
        <div className={`md:hidden fixed bottom-0 left-0 right-0 border-t transition-colors duration-300 ${
          isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex justify-around items-center py-2">
            <Link 
              to="/" 
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                location.pathname === '/' 
                  ? isDarkTheme
                    ? 'text-purple-400 bg-purple-900/30'
                    : 'text-purple-600 bg-purple-100'
                  : isDarkTheme 
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-medium">Home</span>
            </Link>

            <Link 
              to="/dashboard" 
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                location.pathname === '/dashboard' 
                  ? isDarkTheme
                    ? 'text-purple-400 bg-purple-900/30'
                    : 'text-purple-600 bg-purple-100'
                  : isDarkTheme 
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs font-medium">Dashboard</span>
            </Link>

            <Link 
              to="/profile" 
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                location.pathname === '/profile' 
                  ? isDarkTheme
                    ? 'text-purple-400 bg-purple-900/30'
                    : 'text-purple-600 bg-purple-100'
                  : isDarkTheme 
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-medium">Profile</span>
            </Link>

            <button 
              onClick={handleThemeToggle}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                isDarkTheme 
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {isDarkTheme ? (
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              <span className="text-xs font-medium">Theme</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

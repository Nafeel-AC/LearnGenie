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
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Check if current route is authentication page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'

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
      {/* Navigation - hidden on auth pages */}
      {!isAuthPage && (
        <nav className={`flex items-center justify-between px-6 py-4 mx-6 mb-6 rounded-full shadow-lg transition-colors duration-300 ${
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
        <div className={`hidden md:flex items-center px-6 py-3 rounded-full transition-colors duration-300 ${
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

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home isDarkTheme={isDarkTheme} />} />
        <Route path="/login" element={user ? <Dashboard /> : <Login />} />
        <Route path="/signup" element={user ? <Dashboard /> : <SignUp />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Login />} />
        <Route path="/profile" element={user ? <Profile /> : <Login />} />
        <Route path="/chat/:bookId" element={user ? <ChatInterface /> : <Login />} />
      </Routes>
    </div>
  )
}

export default App

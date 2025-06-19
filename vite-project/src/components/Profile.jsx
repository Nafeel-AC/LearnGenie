import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Profile = ({ isDarkTheme = false }) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkTheme 
          ? 'bg-gradient-to-br from-gray-900 to-blue-900' 
          : 'bg-gradient-to-br from-gray-50 to-blue-50'
      }`}>
        <p className={`transition-colors duration-300 ${
          isDarkTheme ? 'text-gray-400' : 'text-gray-500'
        }`}>Please log in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDarkTheme 
        ? 'bg-gradient-to-br from-gray-900 to-blue-900' 
        : 'bg-gradient-to-br from-gray-50 to-blue-50'
    }`}>
      <div className={`max-w-md mx-auto rounded-xl shadow-lg overflow-hidden transition-colors duration-300 ${
        isDarkTheme ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="px-6 py-8">
          <div className="text-center">
            {/* Profile Avatar */}
            <div className="mx-auto h-24 w-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            
            {/* User Info */}
            <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Profile
            </h2>
            
            <div className="space-y-4 text-left">
              <div className={`p-4 rounded-lg transition-colors duration-300 ${
                isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email
                </label>
                <p className={`transition-colors duration-300 ${
                  isDarkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  {user.email || 'No email provided'}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg transition-colors duration-300 ${
                isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  User ID
                </label>
                <p className={`text-sm font-mono transition-colors duration-300 ${
                  isDarkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  {user.id}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg transition-colors duration-300 ${
                isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Last Sign In
                </label>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile 
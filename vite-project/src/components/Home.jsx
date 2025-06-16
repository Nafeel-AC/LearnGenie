import React from 'react'

const Home = ({ isDarkTheme }) => {
  return (
    <>
      {/* Hero Section */}
      <div className="container mx-auto px-6 pb-8">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          {/* Left Content */}
          <div className="lg:w-1/2 mb-12 lg:mb-0 lg:ml-8">
            {/* Learn Smarter, Not Harder */}
            <p className="text-purple-600 font-medium mb-4 text-xl lg:text-2xl">
              Learn Smarter, Not Harder
            </p>
            
            {/* Main Heading */}
            <h1 className={`text-6xl lg:text-7xl font-bold mb-6 leading-tight transition-colors duration-300 ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Meet Your Personal
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                AI Tutor
              </span>
            </h1>
            
            {/* Description */}
            <p className={`text-xl lg:text-2xl mb-8 leading-relaxed max-w-lg transition-colors duration-300 ${
              isDarkTheme ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Master math, science, or coding with an AI tutor that adapts to your pace, your questions.
            </p>
          </div>

          {/* Right Content - Robot Image */}
          <div className="lg:w-1/2 flex justify-center lg:justify-end lg:pr-6">
            <div className="relative">
              {/* Robot Image - Made bigger and moved left */}
              <img 
                src="/robot.png" 
                alt="AI Tutor Robot" 
                className="w-[450px] h-[450px] lg:w-[600px] lg:h-[600px] object-contain"
              />
              
              {/* Floating Elements */}
              <div className={`absolute top-16 left-0 rounded-lg shadow-lg p-3 transform -rotate-12 transition-colors duration-300 ${
                isDarkTheme ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  📚
                </div>
              </div>
              
              <div className={`absolute bottom-28 left-12 rounded-lg shadow-lg p-3 transform rotate-12 transition-colors duration-300 ${
                isDarkTheme ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="w-12 h-8 bg-purple-100 rounded flex items-center justify-center">
                  📖
                </div>
              </div>
              
              <div className={`absolute bottom-16 right-4 rounded-lg shadow-lg p-3 transform -rotate-6 transition-colors duration-300 ${
                isDarkTheme ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                  ✏️
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Home 
import React from 'react';
import Loader from './Loader';

const LoaderDemo = ({ isDarkTheme = false }) => {
  return (
    <div className={`min-h-screen p-8 ${
      isDarkTheme ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      <div className="max-w-4xl mx-auto">
        <h1 className={`text-3xl font-bold mb-8 text-center ${
          isDarkTheme ? 'text-white' : 'text-gray-900'
        }`}>
          Newton's Cradle Loader Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Default Size */}
          <div className={`p-6 rounded-2xl border text-center ${
            isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>Default (50px)</h3>
            <div className="flex justify-center mb-4">
              <Loader isDarkTheme={isDarkTheme} />
            </div>
            <p className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>Standard size for most use cases</p>
          </div>

          {/* Small Size */}
          <div className={`p-6 rounded-2xl border text-center ${
            isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>Small (24px)</h3>
            <div className="flex justify-center mb-4">
              <Loader size={24} isDarkTheme={isDarkTheme} />
            </div>
            <p className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>Perfect for inline loading states</p>
          </div>

          {/* Large Size */}
          <div className={`p-6 rounded-2xl border text-center ${
            isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>Large (80px)</h3>
            <div className="flex justify-center mb-4">
              <Loader size={80} isDarkTheme={isDarkTheme} />
            </div>
            <p className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>Great for page loading states</p>
          </div>

          {/* Custom Color Blue */}
          <div className={`p-6 rounded-2xl border text-center ${
            isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>Custom Blue</h3>
            <div className="flex justify-center mb-4">
              <Loader color="#3B82F6" />
            </div>
            <p className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>Custom color override</p>
          </div>

          {/* Custom Color Green */}
          <div className={`p-6 rounded-2xl border text-center ${
            isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>Custom Green</h3>
            <div className="flex justify-center mb-4">
              <Loader color="#10B981" />
            </div>
            <p className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>Success states</p>
          </div>

          {/* Custom Color Red */}
          <div className={`p-6 rounded-2xl border text-center ${
            isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>Custom Red</h3>
            <div className="flex justify-center mb-4">
              <Loader color="#EF4444" />
            </div>
            <p className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>Error states</p>
          </div>
        </div>

        <div className={`mt-12 p-6 rounded-2xl border ${
          isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-xl font-semibold mb-4 ${
            isDarkTheme ? 'text-white' : 'text-gray-900'
          }`}>Usage Examples</h3>
          
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              isDarkTheme ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <code className={`text-sm ${
                isDarkTheme ? 'text-green-400' : 'text-green-600'
              }`}>
                {`<Loader />`}
              </code>
              <p className={`text-sm mt-2 ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>Default loader with theme detection</p>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isDarkTheme ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <code className={`text-sm ${
                isDarkTheme ? 'text-green-400' : 'text-green-600'
              }`}>
                {`<Loader size={24} isDarkTheme={isDarkTheme} />`}
              </code>
              <p className={`text-sm mt-2 ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>Small loader with explicit theme</p>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isDarkTheme ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <code className={`text-sm ${
                isDarkTheme ? 'text-green-400' : 'text-green-600'
              }`}>
                {`<Loader size={60} color="#3B82F6" />`}
              </code>
              <p className={`text-sm mt-2 ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>Custom size and color</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoaderDemo; 
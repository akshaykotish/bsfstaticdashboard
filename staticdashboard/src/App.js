// src/App.js
import React, { useState, useEffect } from 'react';
import HomePage from './Home';
import Engineering from './Engineering';
import { 
  LayoutGrid, Home
} from 'lucide-react';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home');

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center neu-bg">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 neu-raised rounded-2xl flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="BSF Logo" 
              className="w-14 h-14 object-contain"
            />
          </div>
          <h2 className="text-sm font-medium text-gray-600 mb-3">Border Security Force</h2>
          <div className="flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen neu-bg">
      {/* Fixed Chrome-like Tab Header with Darker Theme */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
        style={{ 
          backgroundColor: 'rgba(31, 41, 55, 0.95)', // Dark gray with transparency
          borderBottomColor: 'rgba(55, 65, 81, 0.5)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="flex items-center h-12 px-3">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2.5 pr-3">
            <img 
              src="/logo.png" 
              alt="BSF Logo" 
              className="w-5 h-5 object-contain brightness-110"
            />
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-gray-100">BSF DASHBOARD</span>
              <span className="text-[10px] text-gray-400">Command Control Center</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-600 mx-3"></div>

          {/* Navigation Tabs */}
          <div className="flex items-center h-full gap-1.5" style={{ minWidth: '400px' }}>
            {/* Home Tab */}
            <button 
              onClick={() => handleNavigate('home')}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                currentView === 'home' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105' 
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-gray-100'
              }`}
              style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: '6px',
                minWidth: 'fit-content'
              }}
            >
              <Home 
                style={{ 
                  width: '14px', 
                  height: '14px', 
                  flexShrink: 0,
                  strokeWidth: currentView === 'home' ? 2.5 : 2
                }} 
              />
              <span 
                style={{ 
                  whiteSpace: 'nowrap', 
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: currentView === 'home' ? '600' : '500'
                }}
              >
                Home
              </span>
            </button>

            {/* Engineering Tab */}
            <button 
              onClick={() => handleNavigate('engineering')}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                currentView === 'engineering' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105' 
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 hover:text-gray-100'
              }`}
              style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: '6px',
                minWidth: 'fit-content'
              }}
            >
              <LayoutGrid 
                style={{ 
                  width: '14px', 
                  height: '14px', 
                  flexShrink: 0,
                  strokeWidth: currentView === 'engineering' ? 2.5 : 2
                }} 
              />
              <span 
                style={{ 
                  whiteSpace: 'nowrap', 
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: currentView === 'engineering' ? '600' : '500'
                }}
              >
                Engineering
              </span>
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Status Indicators */}
          <div className="flex items-center gap-3 mr-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400">www.akshaykotish.com</span> | <span className="text-[10px] text-gray-400">connect@akshaykotish.com</span>
            </div>
            <div className="h-4 w-px bg-gray-600"></div>
          </div>

          {/* Version Info */}
          <div className="px-2 text-[10px] text-gray-500">
            v2.1.0 | © 2024 BSF
          </div>
        </div>
      </header>

      {/* Main Content Area with top padding for fixed header */}
      <main className="max-w-[1920px] mx-auto px-6 py-6" style={{ paddingTop: '72px' }}>
        <div className="neu-content-wrapper">
          {currentView === 'home' && <HomePage onNavigate={handleNavigate} />}
          {currentView === 'engineering' && <Engineering />}
        </div>
      </main>

      {/* Add custom styles for the dark theme */}
      <style jsx>{`
        .neu-bg {
          background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
          min-height: 100vh;
        }
        
        .neu-content-wrapper {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar for dark theme */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(31, 41, 55, 0.7);
        }
      `}</style>
    </div>
  );
};

export default App;
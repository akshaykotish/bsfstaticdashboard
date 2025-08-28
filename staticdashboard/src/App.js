// src/App.js
import React, { useState, useEffect } from 'react';
import Engineering from './Engineering';
import { 
  Building, Menu, X, ChevronRight, Bell, Search, Shield, ChevronLeft
} from 'lucide-react';

const App = () => {
  const [activeMenu, setActiveMenu] = useState('engineering');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  const menuItems = [
    { id: 'engineering', label: 'Engineering Operations', icon: Building }
  ];

  const renderContent = () => {
    return <Engineering />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 neu-raised rounded-full flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="BSF Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Border Security Force</h2>
          <p className="text-sm text-gray-600">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white relative overflow-hidden">
      {/* Neumorphism Background Pattern */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-200 rounded-full filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-100 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Left Sidebar with Neumorphism - Optimized */}
      <div 
        className={`fixed z-50 bg-gray-50 transition-[width] duration-300 ease-out flex flex-col neu-sidebar-shadow overflow-hidden rounded-r-2xl ${
          sidebarExpanded ? 'w-72' : 'w-20'
        }`}
        style={{
          top: '20px',
          left: '0',
          bottom: '20px',
          height: 'calc(100vh - 40px)'
        }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="BSF Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div 
              className={`flex flex-col transition-opacity duration-300 ${
                !sidebarExpanded ? 'opacity-0 invisible' : 'opacity-100 visible'
              }`}
            >
              <span className="text-xl font-extrabold text-neu-primary whitespace-nowrap">
                BSF
              </span>
              <span className="text-xs text-neu-text-light font-medium tracking-wide whitespace-nowrap">
                Command Center
              </span>
            </div>
            <div className={`transition-opacity duration-300 ${
              !sidebarExpanded ? 'opacity-0' : 'opacity-100'
            }`}>
              <div className="text-gray-400">
                {sidebarExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </div>
            </div>
          </div>
        </div>

        {/* Military Badge */}
        {sidebarExpanded && (
          <div className="px-6 py-4 text-center border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-800 mb-1">Border Security Force</div>
            <div className="text-xs text-gray-600 italic">सीमा सुरक्षा बल</div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="px-3 mb-2"
            >
              <button
                className={`w-full flex items-center gap-3 py-3.5 px-3 rounded-xl transition-colors duration-200 relative ${
                  !sidebarExpanded ? 'justify-center' : ''
                } ${
                  activeMenu === item.id 
                    ? 'neu-inset text-neu-primary' 
                    : 'neu-flat text-gray-600 hover:neu-flat-hover hover:text-gray-700'
                }`}
                onClick={() => setActiveMenu(item.id)}
                title={!sidebarExpanded ? item.label : ''}
              >
                <item.icon 
                  size={20} 
                  className={`flex-shrink-0 ${
                    activeMenu === item.id ? 'text-neu-primary' : ''
                  }`} 
                />
                {sidebarExpanded && (
                  <span className="text-sm whitespace-nowrap">
                    {item.label}
                  </span>
                )}
                {activeMenu === item.id && sidebarExpanded && (
                  <div className="absolute right-2 w-2 h-2 bg-neu-primary rounded-full"></div>
                )}
              </button>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {sidebarExpanded && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="whitespace-nowrap">
                Secure Connection
              </span>
            </div>
          </div>
        )}

        {/* Hover Indicator - shows at the edge when collapsed */}
        {!sidebarExpanded && (
          <div className="absolute top-1/2 -translate-y-1/2 right-0">
            <div className="bg-orange-500 w-1 h-16 rounded-l-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 relative z-10`}
        style={{
          marginLeft: sidebarExpanded ? '288px' : '80px'
        }}
      >
        {/* Page Content */}
        <div className="flex-1 p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default App;
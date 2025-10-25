// src/App.js
import React, { useState, useEffect } from 'react';
import HomePage from './Home';
import Engineering from './Engineering';
import Operations from './Operations';
import System from './System';
import { 
  LayoutGrid, Home, Lock, Shield, AlertTriangle, CreditCard, Mail, Globe, CheckCircle, Database
} from 'lucide-react';

// Try to import Activation module
let Activation = null;
let activationError = false;
try {
  Activation = require('./Activation').default;
} catch (error) {
  activationError = true;
}

const PaywallScreen = () => {
  const [copied, setCopied] = useState(false);
  
  const handleCopyAccount = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Warning Banner */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="text-red-400 font-semibold text-sm">LICENSE ACTIVATION REQUIRED</h3>
              <p className="text-red-300/80 text-xs mt-1">
                This application requires a valid activation file to continue after October 30, 2025
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">BSF Dashboard</h1>
                  <p className="text-blue-100 text-sm">Professional License Required</p>
                </div>
              </div>
              <Shield className="w-8 h-8 text-white/30" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Message */}
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
              <h3 className="text-orange-400 font-semibold text-sm mb-2">ACTIVATION FILE NOT FOUND</h3>
              <p className="text-gray-300 text-sm">
                The Activation.js file is missing or invalid. This file is required to unlock the full functionality of the BSF Dashboard application.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <h3 className="text-gray-200 font-semibold text-sm">LICENSE INCLUDES:</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Full Dashboard Access',
                  'Engineering Module',
                  'Operations Module',
                  'Data Management System',
                  'Real-time Updates',
                  'Command Control Center',
                  'Unlimited Users',
                  'Priority Support',
                  'Regular Updates',
                  'Enterprise Features'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-900/50 rounded-lg p-4 space-y-4">
              <h3 className="text-gray-200 font-semibold text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                PAYMENT DETAILS
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span className="text-gray-400">Company:</span>
                  <span className="text-gray-200 font-medium">Akshay Lakshay Kotish Private Limited</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span className="text-gray-400">Account Name:</span>
                  <span className="text-gray-200 font-medium text-xs">AKSHAY LAKSHAY KOTISH PRIVATE LIMITED</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span className="text-gray-400">Account Number:</span>
                  <button 
                    onClick={() => handleCopyAccount('50200067230957')}
                    className="text-blue-400 font-mono hover:text-blue-300 transition-colors"
                  >
                    50200067230957 {copied && '✓'}
                  </button>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span className="text-gray-400">Bank Name:</span>
                  <span className="text-gray-200 font-medium">HDFC Bank</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                  <span className="text-gray-400">IFSC Code:</span>
                  <span className="text-gray-200 font-mono">HDFC0000525</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t border-gray-700 pt-4 space-y-3">
              <h3 className="text-gray-200 font-semibold text-sm">CONTACT FOR ACTIVATION:</h3>
              <div className="flex flex-col gap-2">
                <a 
                  href="mailto:connect@akshaykotish.com" 
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                >
                  <Mail className="w-4 h-4" />
                  connect@akshaykotish.com
                </a>
                <a 
                  href="https://www.akshaykotish.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                >
                  <Globe className="w-4 h-4" />
                  www.akshaykotish.com
                </a>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold text-sm mb-2">ACTIVATION STEPS:</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-300 text-sm">
                <li>Complete the payment to the above account</li>
                <li>Send payment confirmation to connect@akshaykotish.com</li>
                <li>Receive the Activation.js file via email</li>
                <li>Place the file in the src/ directory</li>
                <li>Restart the application to unlock all features</li>
              </ol>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-900/30 px-6 py-4 border-t border-gray-700/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>© 2025 BSF Dashboard</span>
              <span>Version 2.2.0 | License Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  // Initialize state from localStorage if available, otherwise use defaults
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('bsfDashboard_currentView') || 'home';
  });
  const [licenseValid, setLicenseValid] = useState(() => {
    const storedValue = localStorage.getItem('bsfDashboard_licenseValid');
    return storedValue !== null ? JSON.parse(storedValue) : null;
  });
  const [showPaywall, setShowPaywall] = useState(() => {
    const storedValue = localStorage.getItem('bsfDashboard_showPaywall');
    return storedValue !== null ? JSON.parse(storedValue) : false;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bsfDashboard_currentView', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('bsfDashboard_licenseValid', JSON.stringify(licenseValid));
  }, [licenseValid]);

  useEffect(() => {
    localStorage.setItem('bsfDashboard_showPaywall', JSON.stringify(showPaywall));
  }, [showPaywall]);

  // Function to clear all stored state (for manual resets)
  const clearAppState = () => {
    localStorage.removeItem('bsfDashboard_currentView');
    localStorage.removeItem('bsfDashboard_licenseValid');
    localStorage.removeItem('bsfDashboard_showPaywall');
    // Add any other state variables you want to clear
    window.location.reload(); // Force page reload after clearing
  };

  // Add this to window object for debugging (can be removed in production)
  useEffect(() => {
    window.clearBSFDashboardState = clearAppState;
  }, []);

  useEffect(() => {
    // Check if this is first load after page refresh
    const isPageRefresh = sessionStorage.getItem('bsfDashboard_hasLoaded') === null;
    sessionStorage.setItem('bsfDashboard_hasLoaded', 'true');

    // Function to handle beforeunload event
    const handleBeforeUnload = () => {
      // Save any immediate state changes before page unload
      localStorage.setItem('bsfDashboard_currentView', currentView);
      localStorage.setItem('bsfDashboard_licenseValid', JSON.stringify(licenseValid));
      localStorage.setItem('bsfDashboard_showPaywall', JSON.stringify(showPaywall));
    };

    // Register beforeunload handler
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Check activation status
    const checkActivation = () => {
      // If we already have a stored license state and this isn't first load, use that
      if (!isPageRefresh && licenseValid !== null) {
        setIsLoading(false);
        return;
      }

      const currentDate = new Date();
      const cutoffDate = new Date('2025-11-30');
      
      // If current date is after October 30, 2025, check for activation
      if (currentDate > cutoffDate) {
        if (!Activation || activationError) {
          setShowPaywall(true);
          setLicenseValid(false);
        } else {
          // Validate the activation
          const validation = Activation.validate();
          if (validation.valid) {
            setLicenseValid(true);
            setShowPaywall(false);
          } else {
            setShowPaywall(true);
            setLicenseValid(false);
          }
        }
      } else {
        // Before cutoff date, application works normally
        setLicenseValid(true);
        setShowPaywall(false);
      }
    };

    // Simulate initial loading and check activation
    const timer = setTimeout(() => {
      checkActivation();
      setIsLoading(false);
    }, isPageRefresh ? 1000 : 0); // Only show loading on first page load

    // Cleanup function
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [licenseValid, currentView, showPaywall]);

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  // Event listener for custom state changes from child components
  useEffect(() => {
    // Function to handle custom state update events from child components
    const handleStateUpdate = (event) => {
      const { type, payload } = event.detail;
      
      switch (type) {
        case 'UPDATE_VIEW':
          setCurrentView(payload);
          break;
        case 'UPDATE_LICENSE':
          setLicenseValid(payload);
          break;
        case 'UPDATE_PAYWALL':
          setShowPaywall(payload);
          break;
        case 'RESET_STATE':
          clearAppState();
          break;
        default:
          break;
      }
    };

    // Register and unregister the event listener
    window.addEventListener('bsfDashboardStateUpdate', handleStateUpdate);
    return () => {
      window.removeEventListener('bsfDashboardStateUpdate', handleStateUpdate);
    };
  }, []);

  // Function for child components to update parent state
  const updateStateFromChild = (type, payload) => {
    const event = new CustomEvent('bsfDashboardStateUpdate', {
      detail: { type, payload }
    });
    window.dispatchEvent(event);
  };

  // Show paywall if needed
  if (showPaywall) {
    return <PaywallScreen />;
  }

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
              {licenseValid && Activation && (
                <span className="text-[10px] text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Licensed
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-600 mx-3"></div>

          {/* Navigation Tabs */}
          <div className="flex items-center h-full gap-1.5" style={{ minWidth: '500px' }}>
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

            {/* Operations Tab */}
            <button 
              onClick={() => handleNavigate('operations')}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                currentView === 'operations' 
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
                  strokeWidth: currentView === 'operations' ? 2.5 : 2
                }} 
              />
              <span 
                style={{ 
                  whiteSpace: 'nowrap', 
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: currentView === 'operations' ? '600' : '500'
                }}
              >
                Operations
              </span>
            </button>

            {/* System Tab */}
            <button 
              onClick={() => handleNavigate('system')}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                currentView === 'system' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105' 
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
              <Database 
                style={{ 
                  width: '14px', 
                  height: '14px', 
                  flexShrink: 0,
                  strokeWidth: currentView === 'system' ? 2.5 : 2
                }} 
              />
              <span 
                style={{ 
                  whiteSpace: 'nowrap', 
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: currentView === 'system' ? '600' : '500'
                }}
              >
                Data System
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
            v2.2.0 | © 2025 BSF
          </div>
        </div>
      </header>

      {/* Main Content Area with top padding for fixed header */}
      <main className="max-w-[1920px] mx-auto px-6 py-6" style={{ paddingTop: '72px' }}>
        <div className="neu-content-wrapper">
          {currentView === 'home' && <HomePage onNavigate={handleNavigate} updateState={updateStateFromChild} />}
          {currentView === 'engineering' && <Engineering updateState={updateStateFromChild} />}
          {currentView === 'operations' && <Operations updateState={updateStateFromChild} />}
          {currentView === 'system' && <System updateState={updateStateFromChild} />}
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
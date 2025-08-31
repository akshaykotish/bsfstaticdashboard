// tailwind.config.js - Apple Store Inspired Theme (Reduced Font Sizes)
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple Design System Colors
        apple: {
          // Label Colors
          'label': '#1d1d1f',
          'secondary-label': '#86868b',
          'tertiary-label': '#c7c7cc',
          'quaternary-label': '#d1d1d6',
          
          // Fill Colors
          'fill': 'rgba(120, 120, 128, 0.12)',
          'fill-secondary': 'rgba(120, 120, 128, 0.08)',
          'fill-tertiary': 'rgba(118, 118, 128, 0.04)',
          'fill-quaternary': 'rgba(116, 116, 128, 0.02)',
          
          // Background Colors
          'background': '#f5f5f7',
          'background-secondary': '#ffffff',
          'background-tertiary': '#f2f2f7',
          'background-elevated': '#ffffff',
          
          // Grouped Background Colors
          'grouped-background': '#f2f2f7',
          'grouped-background-secondary': '#ffffff',
          'grouped-background-tertiary': '#f2f2f7',
          
          // Separator Colors
          'separator': 'rgba(60, 60, 67, 0.12)',
          'separator-opaque': '#c6c6c8',
          
          // Link Color
          'link': '#0071e3',
          
          // System Colors
          'blue': '#0071e3',
          'blue-hover': '#0077ed',
          'blue-active': '#006edb',
          'green': '#34c759',
          'green-hover': '#30b853',
          'green-active': '#2ca94c',
          'indigo': '#5856d6',
          'indigo-hover': '#4f4dd0',
          'indigo-active': '#4644c9',
          'orange': '#ff9500',
          'orange-hover': '#f59000',
          'orange-active': '#e68900',
          'pink': '#ff2d55',
          'pink-hover': '#f5284f',
          'pink-active': '#e62348',
          'purple': '#af52de',
          'purple-hover': '#a64dd8',
          'purple-active': '#9d48d1',
          'red': '#ff3b30',
          'red-hover': '#f5362b',
          'red-active': '#e63126',
          'teal': '#5ac8fa',
          'teal-hover': '#55bef0',
          'teal-active': '#50b4e6',
          'yellow': '#ffcc00',
          'yellow-hover': '#f5c200',
          'yellow-active': '#e6b800',
          
          // Grays
          'gray': '#8e8e93',
          'gray-2': '#c7c7cc',
          'gray-3': '#d1d1d6',
          'gray-4': '#e5e5ea',
          'gray-5': '#f2f2f7',
          'gray-6': '#f7f7f7',
          
          // Dark Mode Colors
          'dark': {
            'label': '#f5f5f7',
            'secondary-label': '#86868b',
            'tertiary-label': '#48484a',
            'quaternary-label': '#3a3a3c',
            'fill': 'rgba(120, 120, 128, 0.24)',
            'fill-secondary': 'rgba(120, 120, 128, 0.16)',
            'fill-tertiary': 'rgba(118, 118, 128, 0.08)',
            'fill-quaternary': 'rgba(116, 116, 128, 0.04)',
            'background': '#000000',
            'background-secondary': '#1d1d1f',
            'background-tertiary': '#2c2c2e',
            'background-elevated': '#1c1c1e',
            'separator': 'rgba(84, 84, 88, 0.4)',
            'separator-opaque': '#38383a',
          }
        },
        
        // Store-specific Colors
        store: {
          'blue': '#0071e3',
          'gray': '#f5f5f7',
          'text': '#1d1d1f',
          'text-secondary': '#86868b',
          'border': 'rgba(0, 0, 0, 0.08)',
          'shadow': 'rgba(0, 0, 0, 0.04)',
        },
      },
      
      fontFamily: {
        'sf-pro': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        'sf-display': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'sf-text': ['SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'sf-mono': ['SF Mono', 'Monaco', 'Courier New', 'monospace'],
        'new-york': ['New York', 'Georgia', 'serif'],
      },
      
      fontSize: {
        // Apple Typography Scale - Reduced Sizes
        'apple-largetitle': ['28px', { lineHeight: '32px', letterSpacing: '0.374px' }],
        'apple-title1': ['24px', { lineHeight: '28px', letterSpacing: '0.364px' }],
        'apple-title2': ['20px', { lineHeight: '24px', letterSpacing: '-0.408px' }],
        'apple-title3': ['17px', { lineHeight: '22px', letterSpacing: '-0.45px' }],
        'apple-headline': ['15px', { lineHeight: '20px', letterSpacing: '-0.408px', fontWeight: '600' }],
        'apple-body': ['14px', { lineHeight: '20px', letterSpacing: '-0.408px' }],
        'apple-callout': ['13px', { lineHeight: '18px', letterSpacing: '-0.32px' }],
        'apple-subheadline': ['12px', { lineHeight: '16px', letterSpacing: '-0.24px' }],
        'apple-footnote': ['11px', { lineHeight: '14px', letterSpacing: '-0.078px' }],
        'apple-caption1': ['10px', { lineHeight: '13px', letterSpacing: '0px' }],
        'apple-caption2': ['9px', { lineHeight: '11px', letterSpacing: '0.066px' }],
      },
      
      spacing: {
        // Apple Spacing System
        'apple-1': '4px',
        'apple-2': '8px',
        'apple-3': '12px',
        'apple-4': '16px',
        'apple-5': '20px',
        'apple-6': '24px',
        'apple-7': '28px',
        'apple-8': '32px',
        'apple-9': '36px',
        'apple-10': '40px',
        'apple-12': '48px',
        'apple-14': '56px',
        'apple-16': '64px',
        'apple-20': '80px',
        'apple-24': '96px',
        'apple-32': '128px',
        'apple-40': '160px',
        'apple-48': '192px',
        'apple-56': '224px',
        'apple-64': '256px',
      },
      
      animation: {
        'apple-bounce': 'appleBounce 1s infinite',
        'apple-pulse': 'applePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'apple-spin': 'appleSpin 1s linear infinite',
        'apple-fade-in': 'appleFadeIn 0.3s ease-out',
        'apple-slide-up': 'appleSlideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'apple-slide-down': 'appleSlideDown 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'apple-scale-in': 'appleScaleIn 0.2s ease-out',
        'shimmer-apple': 'shimmerApple 2s linear infinite',
      },
      
      keyframes: {
        appleBounce: {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        applePulse: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.5',
          },
        },
        appleSpin: {
          from: {
            transform: 'rotate(0deg)',
          },
          to: {
            transform: 'rotate(360deg)',
          },
        },
        appleFadeIn: {
          from: {
            opacity: '0',
          },
          to: {
            opacity: '1',
          },
        },
        appleSlideUp: {
          from: {
            transform: 'translateY(100%)',
            opacity: '0',
          },
          to: {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        appleSlideDown: {
          from: {
            transform: 'translateY(-100%)',
            opacity: '0',
          },
          to: {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        appleScaleIn: {
          from: {
            transform: 'scale(0.95)',
            opacity: '0',
          },
          to: {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
        shimmerApple: {
          '0%': {
            backgroundPosition: '-200% 0',
          },
          '100%': {
            backgroundPosition: '200% 0',
          },
        },
      },
      
      boxShadow: {
        // Apple Shadows
        'apple-sm': '0 1px 3px rgba(0, 0, 0, 0.12)',
        'apple': '0 2px 8px rgba(0, 0, 0, 0.04), 0 0 2px rgba(0, 0, 0, 0.06)',
        'apple-md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'apple-lg': '0 8px 20px rgba(0, 0, 0, 0.12)',
        'apple-xl': '0 12px 28px rgba(0, 0, 0, 0.15)',
        'apple-2xl': '0 20px 40px rgba(0, 0, 0, 0.2)',
        'apple-hover': '0 12px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        'apple-inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        'apple-none': 'none',
        
        // Card Shadows
        'card': '0 2px 8px rgba(0, 0, 0, 0.04), 0 0 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 12px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        
        // Colored Shadows
        'blue': '0 4px 14px rgba(0, 113, 227, 0.3)',
        'green': '0 4px 14px rgba(52, 199, 89, 0.3)',
        'orange': '0 4px 14px rgba(255, 149, 0, 0.3)',
        'red': '0 4px 14px rgba(255, 59, 48, 0.3)',
      },
      
      borderRadius: {
        'apple-sm': '6px',
        'apple': '8px',
        'apple-md': '10px',
        'apple-lg': '12px',
        'apple-xl': '18px',
        'apple-2xl': '24px',
        'apple-full': '980px',
      },
      
      backgroundImage: {
        // Apple Gradients
        'apple-gradient': 'linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%)',
        'apple-gradient-radial': 'radial-gradient(ellipse at top, rgba(255, 255, 255, 0.5) 0%, transparent 70%)',
        'apple-blue-gradient': 'linear-gradient(180deg, #0071e3 0%, #0077ed 100%)',
        'apple-green-gradient': 'linear-gradient(180deg, #34c759 0%, #30b853 100%)',
        'apple-orange-gradient': 'linear-gradient(180deg, #ff9500 0%, #f59000 100%)',
        'apple-pink-gradient': 'linear-gradient(180deg, #ff2d55 0%, #f5284f 100%)',
        'apple-purple-gradient': 'linear-gradient(180deg, #af52de 0%, #a64dd8 100%)',
        'apple-red-gradient': 'linear-gradient(180deg, #ff3b30 0%, #f5362b 100%)',
        
        // Glass Effect
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%)',
        'glass-border': 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 100%)',
      },
      
      backdropBlur: {
        'apple-xs': '2px',
        'apple-sm': '8px',
        'apple': '20px',
        'apple-md': '28px',
        'apple-lg': '40px',
        'apple-xl': '80px',
      },
      
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'apple-ease': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'apple-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      transitionDuration: {
        'apple-fast': '200ms',
        'apple': '300ms',
        'apple-slow': '500ms',
      },
    },
  },
  plugins: [
    // Custom plugin for Apple-style utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.backdrop-apple': {
          'backdrop-filter': 'blur(20px) saturate(180%)',
          '-webkit-backdrop-filter': 'blur(20px) saturate(180%)',
        },
        '.glass-apple': {
          'background': 'rgba(255, 255, 255, 0.72)',
          'backdrop-filter': 'blur(20px) saturate(180%)',
          '-webkit-backdrop-filter': 'blur(20px) saturate(180%)',
          'border': '0.5px solid rgba(0, 0, 0, 0.1)',
        },
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.no-scrollbar::-webkit-scrollbar': {
          'display': 'none',
        },
      }
      addUtilities(newUtilities)
    },
  ],
}
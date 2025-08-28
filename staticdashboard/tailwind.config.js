// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neumorphism color palette
        neu: {
          base: '#e0e5ec',
          white: '#ffffff',
          'shadow-dark': '#a3b1c6',
          'shadow-light': '#ffffff',
          primary: '#f97316',
          'primary-dark': '#ea580c',
          'primary-light': '#fb923c',
          text: '#2d3748',
          'text-light': '#718096',
          border: 'rgba(163, 177, 198, 0.2)',
        },
        
        // Keep existing orange colors for components
        primary: '#f97316',
        secondary: '#fb923c',
        accent: '#ea580c',
        
        // Slate colors updated for neumorphism
        slate: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },
        
        // Gray scale for neumorphism
        gray: {
          50: '#fafbfc',
          100: '#f4f5f7',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#8492a6',
          700: '#495057',
          800: '#343a40',
          900: '#1a202c',
        },
        
        // Orange scale
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        
        // Semantic colors
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
        'spin': 'spin 1s linear infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'blob': 'blob 7s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        // Neumorphism shadows
        'neu-sm': '3px 3px 6px #a3b1c6, -3px -3px 6px #ffffff',
        'neu': '5px 5px 10px #a3b1c6, -5px -5px 10px #ffffff',
        'neu-lg': '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
        'neu-xl': '12px 12px 24px #a3b1c6, -12px -12px 24px #ffffff',
        'neu-2xl': '15px 15px 30px #a3b1c6, -15px -15px 30px #ffffff',
        'neu-inset': 'inset 5px 5px 10px #a3b1c6, inset -5px -5px 10px #ffffff',
        'neu-inset-sm': 'inset 3px 3px 6px #a3b1c6, inset -3px -3px 6px #ffffff',
        'neu-inset-lg': 'inset 8px 8px 16px #a3b1c6, inset -8px -8px 16px #ffffff',
        // Keep some original shadows
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.3)',
        'glow-orange-lg': '0 0 30px rgba(249, 115, 22, 0.4)',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-orange': 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
        'gradient-slate': 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        'gradient-neu': 'linear-gradient(145deg, #f0f5fd, #d0d5dc)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(251, 146, 60, 0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(148, 163, 184, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(249, 115, 22, 0.1) 0px, transparent 50%)',
        'pattern-dots': 'radial-gradient(circle, rgba(163, 177, 198, 0.1) 1px, transparent 1px)',
        'pattern-grid': 'linear-gradient(rgba(163, 177, 198, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(163, 177, 198, 0.05) 1px, transparent 1px)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
/**
 * Jiji Freight Theme Configuration
 * Color scheme and styling for the platform
 */

export const theme = {
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#F0F6FB',
      100: '#D1E7F5',
      200: '#A3D0EC',
      300: '#75B9E2',
      400: '#4697D9',
      500: '#1E90FF', // Main blue
      600: '#1A7FDD',
      700: '#156EBC',
      800: '#105C9A',
      900: '#0C4A79',
      dark: '#003D7A', // Dark blue (header)
    },
    // Accent Colors
    accent: {
      yellow: '#FFD700', // Gold/Yellow from flyer
      gold: '#FFC700',
      amber: '#FFA500',
    },
    // Status Colors
    status: {
      success: '#27AE60',
      warning: '#F39C12',
      danger: '#E74C3C',
      info: '#3498DB',
    },
    // Neutral Colors
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    // Semantic Colors
    semantic: {
      background: '#F5F7FA',
      surface: '#FFFFFF',
      border: '#E5E7EB',
      text: '#1F2937',
      textSecondary: '#6B7280',
    },
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['Menlo', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  borderRadius: {
    none: '0',
    sm: '2px',
    base: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },

  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

export const gradients = {
  primary: 'linear-gradient(135deg, #003D7A 0%, #1E90FF 100%)',
  accent: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
  hero: 'linear-gradient(180deg, #003D7A 0%, #1E90FF 50%, #E8F1F9 100%)',
  card: 'linear-gradient(135deg, rgba(30, 144, 255, 0.05) 0%, rgba(255, 215, 0, 0.05) 100%)',
}

export const buttonVariants = {
  primary: {
    background: '#1E90FF',
    color: '#FFFFFF',
    hover: '#1A7FDD',
    active: '#156EBC',
  },
  secondary: {
    background: '#F5F7FA',
    color: '#1F2937',
    hover: '#E5E7EB',
    active: '#D1D5DB',
  },
  accent: {
    background: '#FFD700',
    color: '#003D7A',
    hover: '#FFC700',
    active: '#FFA500',
  },
  danger: {
    background: '#E74C3C',
    color: '#FFFFFF',
    hover: '#C0392B',
    active: '#A93226',
  },
}

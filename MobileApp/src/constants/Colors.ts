// Color constants for the application based on Figma Design System
export const LightTheme = {
  // Primary Colors
  primary: '#643FDB',
  primaryContainer: '#837BE7',
  
  // Accent Colors  
  accent: '#FF8A00',
  accentContainer: '#FFE7CC',
  
  // Neutral Colors
  neutral: {
    dark: '#1C1243',
    medium: '#A29FB6', 
    light: '#EFF1F3',
    white: '#FFFFFF',
  },
  
  // Semantic Colors
  semantic: {
    error: '#FF6A5D',
    success: '#47C272',
    warning: '#FF8A00',
    info: '#643FDB',
  },
  
  // Overlay Colors
  overlay: {
    pink: '#E15A93',
    coral: '#FF6A5D',
    purple: '#837BE7',
    blue: '#DEDED',
    cream: '#FFE7CC',
    lightPink: '#F4D8E8',
    peach: '#FFD7D4',
  },
  
  // Task status colors
  status: {
    todo: '#A29FB6',
    inProgress: '#643FDB',
    done: '#47C272',
    cancelled: '#FF6A5D',
  },
  
  // Priority colors
  priority: {
    urgent: '#E15A93',
    high: '#FF6A5D',
    medium: '#FF8A00',
    low: '#47C272',
    lowest: '#A29FB6',
  },
  
  // Common colors
  background: '#FFFFFF',
  surface: '#EFF1F3',
  surfaceVariant: '#F4D8E8',
  text: '#1C1243',
  textSecondary: '#A29FB6',
  textTertiary: '#1C1243CC', // 80% opacity
  border: '#EFF1F3',
  divider: '#A29FB6',
  
  // Aliases for backward compatibility
  error: '#FF6A5D',
  success: '#47C272',
  warning: '#FF8A00',
  info: '#643FDB',
};

// Export as default Colors for current usage
export const Colors = LightTheme;

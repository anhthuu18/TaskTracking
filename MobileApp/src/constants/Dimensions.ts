import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const SCREEN_WIDTH = screenWidth;
export const SCREEN_HEIGHT = screenHeight;

// Common spacing values
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius values
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

// Typography System - SF Pro Text (based on Figma Design System)

// Font sizes (for backward compatibility)
export const FontSize = {
  caption: 12,
  body: 14,
  header1: 18,
  header2: 16,
  header3: 16,
  title: 24,
  
  // Legacy sizes
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  header: 32,
};

// Font weights
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Line heights
export const LineHeight = {
  tight: 16,
  normal: 20,
  relaxed: 24,
  loose: 28,
  extraLoose: 36,
};

// Common heights
export const Heights = {
  button: 48,
  input: 56,
  card: 120,
  appBar: 56,
};

// Z-index values
export const ZIndex = {
  modal: 1000,
  overlay: 999,
  dropdown: 998,
  tooltip: 997,
  fab: 996,
};

// Screen Layout Spacing - Centralized configuration for consistent spacing across all screens
export const ScreenLayout = {
  // Header spacing from top of screen
  headerTopSpacing: 60,
  
  // Footer spacing from bottom of screen  
  footerBottomSpacing: 40,
  
  // Content horizontal padding (left/right margins)
  contentHorizontalPadding: 20,
  
  // Content vertical spacing 
  contentTopSpacing: 30,
  contentBottomSpacing: 20,
  
  // Section spacing
  sectionSpacing: 30,
  
  // Safe area adjustments
  safeAreaTopPadding: 48,
  safeAreaBottomPadding: 30,
};

// Button Styles - Consistent button configurations
export const ButtonStyles = {
  // Primary action button (like OnboardingScreen next button)
  primary: {
    paddingVertical: 18,
    paddingHorizontal: Spacing.xl, // 48px
    borderRadius: BorderRadius.xl,  // 24px
    minWidth: 200,
    minHeight: 54,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Secondary button
  secondary: {
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,  // 32px
    borderRadius: BorderRadius.lg,  // 16px
    minHeight: Heights.button,      // 48px
  },
  
  // Small button
  small: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,  // 24px
    borderRadius: BorderRadius.md,  // 12px
    minHeight: 40,
  },
};

export const Typography = {
    title: {
      fontSize: FontSize.title,
      lineHeight: LineHeight.extraLoose,
      fontWeight: FontWeight.bold,
      fontFamily: 'SF Pro Text',
    },
    header1: {
      fontSize: FontSize.header1,
      lineHeight: LineHeight.relaxed,
      fontWeight: FontWeight.bold,
      fontFamily: 'SF Pro Text',
    },
    header2: {
      fontSize: FontSize.header2,
      lineHeight: LineHeight.relaxed,
      fontWeight: FontWeight.bold,
      fontFamily: 'SF Pro Text',
    },
    header3: {
      fontSize: FontSize.header3,
      lineHeight: LineHeight.relaxed,
      fontWeight: FontWeight.medium,
      fontFamily: 'SF Pro Text',
    },
    body: {
      fontSize: FontSize.body,
      lineHeight: LineHeight.relaxed,
      fontWeight: FontWeight.medium,
      fontFamily: 'SF Pro Text',
    },
    caption: {
      fontSize: FontSize.caption,
      lineHeight: LineHeight.relaxed,
      fontWeight: FontWeight.medium,
      fontFamily: 'SF Pro Text',
    },
    // Button text styles
    buttonText: {
      fontSize: FontSize.body,
      fontWeight: FontWeight.medium,
      fontFamily: 'SF Pro Text',
    },
  };
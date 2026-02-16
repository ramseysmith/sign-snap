export const COLORS = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252542',
  primary: '#6C63FF',
  primaryDark: '#5A52D5',
  primaryLight: '#8B83FF',
  accent: '#00D9FF',
  accentDark: '#00B8D9',
  text: '#FFFFFF',
  textSecondary: '#B8B8C8', // Improved contrast
  textMuted: '#8888A0', // Improved contrast
  error: '#FF6B6B',
  errorDark: '#E85555',
  success: '#4ADE80',
  successDark: '#3BC76E',
  warning: '#FFB800',
  border: '#2D2D45',
  borderLight: '#3D3D55',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  // Signature canvas
  canvas: '#FFFFFF',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadow presets for elevation
export const SHADOWS = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Animation timing presets
export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  springBouncy: {
    damping: 10,
    stiffness: 180,
    mass: 0.8,
  },
};

// Minimum touch target size (accessibility)
export const TOUCH_TARGET = {
  min: 44,
};

export const SIGNATURE_DEFAULT_SIZE = {
  width: 200,
  height: 100,
};

export const DOCUMENT_DIRECTORY = 'signed_documents';

// Monetization
export const PREMIUM_BADGE_COLOR = '#FFD700';

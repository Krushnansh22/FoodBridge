export const colors = {
  primary: '#22c55e',
  primaryDark: '#2E7D32',
  accent: '#f0fdf4',
  greenBorder: '#bbf7d0',
  danger: '#E53935',
  dangerLight: '#FFEBEE',
  warning: '#FB8C00',
  warningLight: '#FFF3E0',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  info: '#1565C0',
  infoLight: '#E3F2FD',

  white: '#ffffff',
  black: '#1a1a1a',
  gray100: '#f8f9fa',
  inputBg: '#f4f6f8',
  border: '#e5e7eb',
  borderAlt: '#e8ecf0',

  background: '#ffffff',
  lightBg: '#f8f9fa',
  card: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  textMuted: '#b0b8c1',
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const radius = {
  sm: 6, md: 10, lg: 14, xl: 20, full: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const foodTypeColors = {
  cooked: { bg: '#E8F5E9', text: '#2E7D32', dot: '#4CAF50' },
  raw: { bg: '#F3E5F5', text: '#6A1B9A', dot: '#9C27B0' },
  packaged: { bg: '#E3F2FD', text: '#1565C0', dot: '#2196F3' },
  beverages: { bg: '#E0F7FA', text: '#00695C', dot: '#009688' },
  bakery: { bg: '#FFF8E1', text: '#E65100', dot: '#FF9800' },
  other: { bg: '#FAFAFA', text: '#424242', dot: '#9E9E9E' },
};

export const statusColors = {
  available: { bg: '#E8F5E9', text: '#2E7D32' },
  requested: { bg: '#FFF3E0', text: '#E65100' },
  collected: { bg: '#E3F2FD', text: '#1565C0' },
  expired: { bg: '#FAFAFA', text: '#9E9E9E' },
  cancelled: { bg: '#FFEBEE', text: '#C62828' },
  pending: { bg: '#FFF8E1', text: '#F57F17' },
  approved: { bg: '#E8F5E9', text: '#2E7D32' },
  rejected: { bg: '#FFEBEE', text: '#C62828' },
};

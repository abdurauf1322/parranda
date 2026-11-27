import { Platform, ViewStyle } from 'react-native';

export const COLORS = {
  bg: '#090E1A',
  surface: '#111827',
  surfaceAlt: '#1A2336',
  border: 'rgba(148, 163, 184, 0.14)',
  borderStrong: 'rgba(148, 163, 184, 0.25)',
  primary: '#22C55E',
  primarySoft: 'rgba(34, 197, 94, 0.12)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245, 158, 11, 0.12)',
  sky: '#38BDF8',
  skySoft: 'rgba(56, 189, 248, 0.12)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239, 68, 68, 0.12)',
  purple: '#A78BFA',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textDim: '#64748B',
};

export const CONTAINER_MAX: ViewStyle = {
  width: '100%',
  maxWidth: 880,
  alignSelf: 'center',
};

export const CARD_SHADOW: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  android: {
    elevation: 4,
  },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
}) as ViewStyle;

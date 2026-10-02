import { Platform, ViewStyle } from 'react-native';

const mediumShadow: ViewStyle = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.6,
  shadowRadius: 12,
  elevation: 4,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.4,
    shadowRadius: 6,
    elevation: 2,
  } as ViewStyle,
  medium: mediumShadow,
  elevated: mediumShadow,
  dock: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.35 : 0.7,
    shadowRadius: 16,
    elevation: 10,
  } as ViewStyle,
  glowTurquoise: {
    shadowColor: '#24D5C4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  } as ViewStyle,
} as const;

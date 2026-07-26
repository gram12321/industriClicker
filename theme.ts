import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  charcoal: '#19211F',
  muted: '#61716B',
  onDark: '#FFFFFF',
  paleGreen: '#E0EEE7',
  primary: '#24584B',
  softBackground: '#F4F6F8',
  surface: '#FFFFFF',
} as const;

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: colors.softBackground,
    onSurface: colors.charcoal,
    primary: colors.primary,
    surface: colors.surface,
    surfaceVariant: '#E4ECE8',
  },
};

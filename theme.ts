import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  charcoal: '#19211F',
  error: '#B3261E',
  muted: '#61716B',
  marketAutomation: '#6C7B75',
  marketAutomationActive: '#4F46E5',
  marketBuy: '#008A62',
  marketGreen: '#008A62',
  marketGold: '#A87500',
  marketSell: '#24584B',
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

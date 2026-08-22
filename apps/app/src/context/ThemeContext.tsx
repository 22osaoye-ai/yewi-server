import React, { createContext, useContext } from 'react';
import { Colors } from '../components/Theme';

export interface ThemeColors {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceWarm: string;
  card: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  price: string;
  coral: string;
  danger: string;
  success: string;
  inputBg: string;
  pillInactiveBg: string;
  pillInactiveText: string;
  pillActiveBg: string;
  pillActiveText: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: Colors as any,
  isDark: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ThemeContext.Provider
      value={{
        colors: Colors as any,
        isDark: false,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

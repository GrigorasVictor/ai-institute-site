"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  applyThemeClass,
  DARK_THEME,
  getPreferredTheme,
  LIGHT_THEME,
  THEME_KEY,
} from "@/lib/theme";

const ThemeContext = createContext({
  theme: "light",
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(LIGHT_THEME);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from storage/media once on mount
  useEffect(() => {
    const initial = getPreferredTheme();
    setTheme(initial);
    applyThemeClass(initial);
    setIsInitialized(true);
  }, []);

  // Persist and apply when theme changes
  useEffect(() => {
    if (!isInitialized || typeof window === "undefined") return;
    window.localStorage.setItem(THEME_KEY, theme);
    applyThemeClass(theme);
  }, [isInitialized, theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === DARK_THEME,
      setTheme,
      toggleTheme: () =>
        setTheme((prev) => (prev === DARK_THEME ? LIGHT_THEME : DARK_THEME)),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

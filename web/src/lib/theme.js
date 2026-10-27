export const THEME_KEY = "theme";
export const LIGHT_THEME = "light";
export const DARK_THEME = "dark";

export const isValidTheme = (value) => value === LIGHT_THEME || value === DARK_THEME;

export const getPreferredTheme = () => {
  if (typeof window === "undefined") return LIGHT_THEME;

  const stored = window.localStorage.getItem(THEME_KEY);
  if (isValidTheme(stored)) return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DARK_THEME
    : LIGHT_THEME;
};

export const applyThemeClass = (theme) => {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", theme === DARK_THEME);
  document.documentElement.dataset.theme = theme;
};

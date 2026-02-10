export type ThemeType = "light" | "dark" | "system" | "auto";

export type ThemeContextType = {
    theme: ThemeType;
    colorScheme: "light" | "dark";
    toggleTheme: (theme: ThemeType) => void;
  };
import { ThemeContext } from "@/hooks/use-theme-context";
import { ThemeType } from "@/types/theme-types";
import SecureStore from '@react-native-async-storage/async-storage';
import { useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

// === ThemeProvider component ===
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const STORAGE_KEY = "app-theme";
  const [appTheme, setAppTheme] = useState<ThemeType>("system");
  const [hydrated, setHydrated] = useState(false);
  const systemColorScheme = useSystemColorScheme();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await SecureStore.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (raw && ["light", "dark", "system", "auto"].includes(raw)) {
          setAppTheme(raw as ThemeType);
        }
      } catch (e) {
        // ignore storage errors and fall back to default
      } finally {
        if (mounted) setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleTheme = (theme: ThemeType) => {
    setAppTheme(theme);
    // Persist selection but don't block UI; ignore errors
    SecureStore.setItem(STORAGE_KEY, theme).catch(() => {});
  };

  // Resolve the actual color scheme based on theme preference
  const getColorScheme = (): "light" | "dark" => {
    if (appTheme === "light") return "light";
    if (appTheme === "dark") return "dark";
    // For "system" or "auto", use the system color scheme
    return systemColorScheme === "dark" ? "dark" : "light";
  };

  // prevent rendering children until theme is loaded to avoid a theme flash
  if (!hydrated) return null;

  return (
    <ThemeContext.Provider
      value={{
        theme: appTheme,
        colorScheme: getColorScheme(),
        toggleTheme: toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

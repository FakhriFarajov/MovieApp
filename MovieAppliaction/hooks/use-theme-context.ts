import { ThemeContextType } from "@/types/theme-types";
import { createContext } from "react";

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

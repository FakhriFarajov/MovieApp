
import { useTheme } from "./use-theme";

export function useColorSchema() {
    const { colorScheme } = useTheme();
    return colorScheme;
}
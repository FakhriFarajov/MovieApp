import ThemeProvider from "@/context/theme-provider";
import LayoutContent from "@/layout/layout-content";
import { SidebarProvider } from '../app/components/Sidebar';
import { AuthProvider } from "./api/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SidebarProvider>
          <LayoutContent />
        </SidebarProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
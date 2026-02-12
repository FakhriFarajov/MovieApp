import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import { UsersPage } from "./pages/UsersPage";
import { TheatresPage } from "./pages/TheatresPage";
import { HallsPage } from "./pages/HallsPage";
import { MoviesPage } from "./pages/MoviesPage";
import { GenresPage } from "./pages/GenresPage";
import { ShowTimesPage } from "./pages/ShowTimesPage";
import { AuthPage } from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./api/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/theatres" element={<TheatresPage />} />
                    <Route path="/halls" element={<HallsPage />} />
                    <Route path="/movies" element={<MoviesPage />} />
                    <Route path="/genres" element={<GenresPage />} />
                    <Route path="/showtimes" element={<ShowTimesPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </DashboardLayout>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

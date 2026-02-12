import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/api/AuthContext";

export function AuthPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);


  const { authState, onLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast({
        title: t("error"),
        description: t("fillAllFields"),
        variant: "destructive",
      });
      return;
    }


    setIsLoading(true);
    try {
      await onLogin(formData.email, formData.password);
      toast({
        title: t("loginSuccess"),
        description: t("welcomeBack"),
      });
      authState.authenticated = true;
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      const message = error?.response?.data?.message || error?.message || t("error");
      toast({
        title: t("error"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl cinema-gradient flex items-center justify-center mb-4 shadow-lg">
            <Film className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">CineAdmin</h1>
          <p className="text-muted-foreground mt-1">{t("dashboard")}</p>
        </div>

        <Card className="cinema-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {t("signIn")}
            </CardTitle>
            <CardDescription>
              {t("signInDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@cinema.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>


              <Button
                type="submit"
                className="w-full h-12 cinema-gradient text-primary-foreground font-semibold"
                disabled={isLoading}
              >
                {t("signIn")}
              </Button>
            </form>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}

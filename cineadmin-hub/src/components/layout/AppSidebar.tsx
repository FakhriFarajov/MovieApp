import { Film, Users, Building2, LayoutGrid, Clapperboard, Globe, Tags, CalendarClock } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/i18n/translations";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const navItems = [
  { titleKey: 'users' as const, url: '/users', icon: Users },
  { titleKey: 'theatres' as const, url: '/theatres', icon: Building2 },
  { titleKey: 'halls' as const, url: '/halls', icon: LayoutGrid },
  { titleKey: 'movies' as const, url: '/movies', icon: Clapperboard },
  { titleKey: 'genres' as const, url: '/genres', icon: Tags },
  { titleKey: 'showTimes' as const, url: '/showtimes', icon: CalendarClock },
];

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'az', label: 'Azərbaycan', flag: '🇦🇿' },
];

export function AppSidebar() {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const currentLang = languages.find(l => l.code === language);

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl cinema-gradient flex items-center justify-center">
            <Film className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">CineAdmin</h1>
            <p className="text-xs text-muted-foreground">{t('dashboard')}</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + '/');
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      className={`h-12 px-4 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-lg'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl">
              <Globe className="w-5 h-5" />
              <span className="flex items-center gap-2">
                <span>{currentLang?.flag}</span>
                <span>{currentLang?.label}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`gap-3 cursor-pointer ${language === lang.code ? 'bg-primary/10' : ''}`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

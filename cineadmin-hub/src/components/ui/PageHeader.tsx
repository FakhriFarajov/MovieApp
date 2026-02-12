import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PageHeaderProps {
  title: string;
  description?: string;
  onAdd?: () => void;
  children?: ReactNode;
}

export function PageHeader({ title, description, onAdd, children }: PageHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {onAdd && (
          <Button onClick={onAdd} className="cinema-gradient text-primary-foreground gap-2">
            <Plus className="w-4 h-4" />
            {t('addNew')}
          </Button>
        )}
      </div>
    </div>
  );
}

import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({ columns, data, keyExtractor }: DataTableProps<T>) {
  const { t } = useLanguage();

  if (data.length === 0) {
    return (
      <div className="cinema-card p-12 text-center">
        <p className="text-muted-foreground">{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="cinema-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            {columns.map((col) => (
              <TableHead key={col.key} className="text-muted-foreground font-semibold">
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={keyExtractor(item)} className="border-border hover:bg-muted/50 transition-colors">
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as ReactNode}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

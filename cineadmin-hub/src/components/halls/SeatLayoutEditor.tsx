import { useLanguage } from "@/contexts/LanguageContext";

interface SeatLayoutEditorProps {
  rows: number;
  columns: number;
  type: 'standard' | 'vip' | 'imax' | 'dolby';
  onRowsChange: (rows: number) => void;
  onColumnsChange: (columns: number) => void;
  editable?: boolean;
}

export function SeatLayoutEditor({
  rows,
  columns,
  type,
  onRowsChange,
  onColumnsChange,
  editable = true,
}: SeatLayoutEditorProps) {
  const { t } = useLanguage();
  const totalSeats = rows * columns;

  const getSeatClass = () => {
    switch (type) {
      case 'vip':
        return 'bg-primary/40 border-primary/60 hover:bg-primary/60';
      case 'imax':
        return 'bg-blue-500/30 border-blue-500/50 hover:bg-blue-500/50';
      case 'dolby':
        return 'bg-purple-500/30 border-purple-500/50 hover:bg-purple-500/50';
      default:
        return 'bg-secondary border-border hover:bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {editable && (
        <div className="flex gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('rows')}
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={rows}
              onChange={(e) => onRowsChange(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full h-11 px-4 rounded-lg bg-input border border-border text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('columns')}
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={columns}
              onChange={(e) => onColumnsChange(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full h-11 px-4 rounded-lg bg-input border border-border text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>
      )}

      <div className="cinema-card p-6 bg-card/50">
        {/* Screen */}
        <div className="mb-8">
          <div className="cinema-screen mx-auto max-w-md"></div>
          <p className="text-center text-xs text-muted-foreground mt-2 uppercase tracking-wider">Screen</p>
        </div>

        {/* Seats Grid */}
        <div className="flex flex-col items-center gap-2 overflow-x-auto pb-4">
          {Array.from({ length: Math.min(rows, 20) }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-2">
              <span className="w-6 text-xs text-muted-foreground text-right">
                {String.fromCharCode(65 + rowIndex)}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(columns, 20) }).map((_, colIndex) => (
                  <div
                    key={colIndex}
                    className={`cinema-seat ${getSeatClass()} border`}
                    title={`${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {(rows > 20 || columns > 20) && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Showing preview of first 20×20 seats
          </p>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-t-md ${getSeatClass()} border`}></div>
            <span className="text-sm text-muted-foreground">
              {t(type as 'standard' | 'vip' | 'imax' | 'dolby')}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {t('totalSeats')}: <span className="font-semibold text-foreground">{totalSeats}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, Trash2, LayoutGrid } from "lucide-react";
import { Hall } from "@/types";
import { SeatLayoutEditor } from "@/components/halls/SeatLayoutEditor";
import { toast } from "sonner";
import { fetchHalls, createHall, updateHall, deleteHall } from "@/api/hallsApi";
import { fetchTheatres } from "@/api/api";

const hallTypes = ['standard', 'vip', 'imax', 'dolby'] as const;

interface TheatreOption { id: string; name: string }

export function HallsPage() {
  const { t } = useLanguage();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [theatres, setTheatres] = useState<TheatreOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewLayoutOpen, setViewLayoutOpen] = useState(false);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [formData, setFormData] = useState({ name: '', theatreId: '', type: 'standard' as Hall['type'], rows: 10, columns: 12 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hallsData, theatresData] = await Promise.all([
        fetchHalls().catch(() => []),
        fetchTheatres().catch(() => []),
      ]);
      setHalls(Array.isArray(hallsData) ? hallsData : []);
      setTheatres(Array.isArray(theatresData) ? theatresData : []);
    } catch (err) {
      console.error("Failed to load halls data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHalls = halls.filter((h) => h.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    setSelectedHall(null);
    setFormData({ name: '', theatreId: theatres[0]?.id || '', type: 'standard', rows: 10, columns: 12 });
    setDialogOpen(true);
  };

  const handleEdit = (hall: Hall) => {
    setSelectedHall(hall);
    setFormData({ name: hall.name, theatreId: hall.theatreId, type: hall.type, rows: hall.rows, columns: hall.columns });
    setDialogOpen(true);
  };

  const handleViewLayout = (hall: Hall) => {
    setSelectedHall(hall);
    setViewLayoutOpen(true);
  };

  const handleDelete = (hall: Hall) => {
    setSelectedHall(hall);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.theatreId) return;
    setSubmitLoading(true);
    try {
      if (selectedHall) {
        await updateHall(selectedHall.id, {
          name: formData.name,
          type: formData.type,
          rows: formData.rows,
          columns: formData.columns,
        });
        toast.success(t('save') + ' ✓');
      } else {
        await createHall({
          theatreId: formData.theatreId,
          name: formData.name,
          type: formData.type,
          rows: formData.rows,
          columns: formData.columns,
        });
        toast.success(t('create') + ' ✓');
      }
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      console.error("Hall save failed", err);
      toast.error(err?.message || t('error'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedHall) return;
    try {
      await deleteHall(selectedHall.id);
      toast.success(t('delete') + ' ✓');
      setDeleteDialogOpen(false);
      loadData();
    } catch (err: any) {
      console.error("Delete hall failed", err);
      toast.error(err?.message || t('error'));
    }
  };

  const getTypeClass = (type: Hall['type']) => {
    const classes = {
      standard: 'hall-type-standard',
      vip: 'hall-type-vip',
      imax: 'hall-type-imax',
      dolby: 'hall-type-dolby',
    };
    return classes[type];
  };

  const columns = [
    { key: 'name', header: t('name'), render: (hall: Hall) => <div className="font-medium">{hall.name}</div> },
    { key: 'theatre', header: t('theatre'), render: (hall: Hall) => <span className="text-muted-foreground">{hall.theatreName || theatres.find(th => th.id === hall.theatreId)?.name || hall.theatreId}</span> },
    { key: 'type', header: t('type'), render: (hall: Hall) => (
      <span className={`status-badge ${getTypeClass(hall.type)}`}>{t(hall.type)}</span>
    )},
    { key: 'seats', header: t('totalSeats'), render: (hall: Hall) => (
      <span className="font-medium">{hall.rows * hall.columns}</span>
    )},
    { key: 'layout', header: t('seatLayout'), render: (hall: Hall) => (
      <Button variant="outline" size="sm" onClick={() => handleViewLayout(hall)} className="gap-2">
        <LayoutGrid className="w-4 h-4" />
        {hall.rows}×{hall.columns}
      </Button>
    )},
    { key: 'actions', header: t('actions'), render: (hall: Hall) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => handleEdit(hall)}><Edit className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => handleDelete(hall)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title={t('halls')} onAdd={handleAdd}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-64" />
        </div>
      </PageHeader>

      {loading ? (
        <div className="p-6 text-center text-muted-foreground">Loading...</div>
      ) : (
        <DataTable columns={columns} data={filteredHalls} keyExtractor={(h) => h.id} />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedHall ? t('edit') : t('create')} {t('halls')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t('name')} *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="theatre">{t('theatre')} *</Label>
                <Select value={formData.theatreId} onValueChange={(v) => setFormData({ ...formData, theatreId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {theatres.map(theatre => (
                      <SelectItem key={theatre.id} value={theatre.id}>{theatre.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="type">{t('type')}</Label>
              <Select value={formData.type} onValueChange={(v: Hall['type']) => setFormData({ ...formData, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {hallTypes.map(type => (
                    <SelectItem key={type} value={type}>{t(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('seatLayout')}</Label>
              <div className="mt-2">
                <SeatLayoutEditor
                  rows={formData.rows}
                  columns={formData.columns}
                  type={formData.type}
                  onRowsChange={(rows) => setFormData({ ...formData, rows })}
                  onColumnsChange={(columns) => setFormData({ ...formData, columns })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.theatreId || submitLoading} className="cinema-gradient">
              {submitLoading ? "..." : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Layout Dialog */}
      <Dialog open={viewLayoutOpen} onOpenChange={setViewLayoutOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedHall?.name} - {t('seatLayout')}</DialogTitle>
          </DialogHeader>
          {selectedHall && (
            <SeatLayoutEditor
              rows={selectedHall.rows}
              columns={selectedHall.columns}
              type={selectedHall.type}
              onRowsChange={() => {}}
              onColumnsChange={() => {}}
              editable={false}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

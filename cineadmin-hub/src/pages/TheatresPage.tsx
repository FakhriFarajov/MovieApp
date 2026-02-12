import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Search, Edit, Trash2, MapPin } from "lucide-react";
import { fetchTheatres, createTheatre, updateTheatre, deleteTheatre } from "@/api/api";
import { Theatre } from "@/types";
import { toast } from "sonner";

export function TheatresPage() {
  const { t } = useLanguage();
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTheatre, setSelectedTheatre] = useState<Theatre | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', latitude: '', longitude: '' });
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredTheatres = theatres.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedTheatre(null);
    setFormData({ name: '', address: '', latitude: '', longitude: '' });
    setDialogOpen(true);
  };

  const handleEdit = (theatre: Theatre) => {
    setSelectedTheatre(theatre);
    setFormData({ name: theatre.name, address: theatre.address, latitude: theatre.latitude, longitude: theatre.longitude });
    setDialogOpen(true);
  };

  const handleDelete = (theatre: Theatre) => {
    setSelectedTheatre(theatre);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    // validation
    if (!formData.name || !formData.address) return;
    (async () => {
      setSubmitLoading(true);
      try {
        if (selectedTheatre) {
          const res = await updateTheatre(selectedTheatre.id, formData as any);
          // update local list using returned data if available
          const updated = res || { id: selectedTheatre.id, ...formData };
          setTheatres((prev) => prev.map(t => t.id === selectedTheatre.id ? { ...t, ...updated } : t));
          toast.success('Theatre updated successfully');
        } else {
          const res = await createTheatre(formData as any);
          const created = res || { id: `t${Date.now()}`, ...formData };
          setTheatres((prev) => [...prev, created]);
          toast.success('Theatre created successfully');
        }
        setDialogOpen(false);
      } catch (err: any) {
        console.error('Theatre submit failed', err);
        toast.error(err?.message || 'Failed to save theatre');
      } finally {
        setSubmitLoading(false);
      }
    })();
  };

  const handleConfirmDelete = () => {
    if (!selectedTheatre) return;
    (async () => {
      setDeleteLoading(true);
      try {
        await deleteTheatre(selectedTheatre.id);
        setTheatres((prev) => prev.filter(t => t.id !== selectedTheatre.id));
        toast.success('Theatre deleted successfully');
        setDeleteDialogOpen(false);
      } catch (err: any) {
        console.error('Delete theatre failed', err);
        toast.error(err?.message || 'Failed to delete theatre');
      } finally {
        setDeleteLoading(false);
      }
    })();
  };

  // load theatres from API on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchTheatres();
        if (!mounted) return;
        if (Array.isArray(data) && data.length) {
          setTheatres(data as Theatre[]);
        }
      } catch (err: any) {
        console.error('Failed to load theatres', err);
        toast.error(err?.message || 'Failed to fetch theatres');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const columns = [
    { key: 'name', header: t('name'), render: (theatre: Theatre) => (
      <div className="font-medium">{theatre.name}</div>
    )},
    { key: 'address', header: t('address'), render: (theatre: Theatre) => (
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="w-4 h-4" />
        {theatre.address}
      </div>
    )},
    { key: 'coordinates', header: 'Coordinates', render: (theatre: Theatre) => (
      <span className="text-sm text-muted-foreground font-mono">{theatre.latitude}, {theatre.longitude}</span>
    )},
    { key: 'actions', header: t('actions'), render: (theatre: Theatre) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => handleEdit(theatre)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleDelete(theatre)} className="text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title={t('theatres')} onAdd={handleAdd}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-64" />
        </div>
      </PageHeader>

      {loading ? (
        <div className="p-6 text-center text-muted-foreground">Loading theatres...</div>
      ) : (
        <DataTable columns={columns} data={filteredTheatres} keyExtractor={(t) => t.id} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTheatre ? t('edit') : t('create')} {t('theatre')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">{t('name')} *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="address">{t('address')} *</Label>
              <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.address || submitLoading} className="cinema-gradient">{submitLoading ? '...' : t('save')}</Button>
          </DialogFooter>
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
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteLoading}>{deleteLoading ? '...' : t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

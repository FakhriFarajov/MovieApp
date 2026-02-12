import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchGenres, createGenre, updateGenre, deleteGenre } from "@/api/api";
import { Genre } from "@/types";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function GenresPage() {
  const { t } = useLanguage();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [genreToDelete, setGenreToDelete] = useState<Genre | null>(null);
  const [formData, setFormData] = useState({ name: "" });

  const handleAdd = () => {
    setEditingGenre(null);
    setFormData({ name: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (genre: Genre) => {
    setEditingGenre(genre);
    setFormData({ name: genre.name });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    (async () => {
      setSubmitLoading(true);
      try {
        if (editingGenre) {
          const res = await updateGenre(editingGenre.id, { name: formData.name });
          const updated = res || { id: editingGenre.id, name: formData.name };
          setGenres((prev) => prev.map(g => g.id === editingGenre.id ? { ...g, ...updated } : g));
        } else {
          const res = await createGenre({ name: formData.name });
          const created = res || { id: `g${Date.now()}`, name: formData.name };
          setGenres((prev) => [...prev, created]);
        }
        setIsDialogOpen(false);
      } catch (err: any) {
        console.error('Genre save failed', err);
        // show toast if available
      } finally {
        setSubmitLoading(false);
      }
    })();
  };

  const handleDelete = () => {
    if (!genreToDelete) return;
    (async () => {
      setDeleteLoading(true);
      try {
        await deleteGenre(genreToDelete.id);
        setGenres((prev) => prev.filter(g => g.id !== genreToDelete.id));
        setGenreToDelete(null);
      } catch (err: any) {
        console.error('Delete genre failed', err);
      } finally {
        setDeleteLoading(false);
      }
    })();
  };

  // load genres on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchGenres();
        if (!mounted) return;
        if (Array.isArray(data)) setGenres(data as Genre[]);
      } catch (err: any) {
        console.error('Failed to load genres', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const columns = [
    { key: "name", header: t("name") },
    {
      key: "actions",
      header: t("actions"),
      render: (genre: Genre) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(genre)}
            className="h-8 w-8"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setGenreToDelete(genre)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t("genres")}
        description={t("genres")}
        onAdd={handleAdd}
      />

      {loading ? (
        <div className="p-6 text-center text-muted-foreground">Loading genres...</div>
      ) : (
        <DataTable columns={columns} data={genres} keyExtractor={(g) => g.id} />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGenre ? t("edit") : t("create")} {t("genres")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder={t("name")}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} className="cinema-gradient" disabled={submitLoading}>
              {submitLoading ? '...' : t("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!genreToDelete} onOpenChange={() => setGenreToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDelete")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" disabled={deleteLoading}>
              {deleteLoading ? '...' : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

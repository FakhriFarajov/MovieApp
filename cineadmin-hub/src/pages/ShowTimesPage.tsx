import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Search, Clock, DollarSign } from "lucide-react";
import { ShowTime } from "@/types";
import { fetchShowTimes, createShowTime, updateShowTime, deleteShowTime } from "@/api/showTimesApi";
import { fetchMovies, fetchTheatres } from "@/api/api";
import { fetchHalls } from "@/api/hallsApi";
import { toast } from "sonner";
import { format } from "date-fns";

interface MovieOption { id: string; originalTitle: string }
interface HallOption { id: string; name: string; theatreId: string; theatreName?: string }
interface TheatreOption { id: string; name: string }

export function ShowTimesPage() {
  const { t } = useLanguage();
  const [showTimes, setShowTimes] = useState<ShowTime[]>([]);
  const [movies, setMovies] = useState<MovieOption[]>([]);
  const [halls, setHalls] = useState<HallOption[]>([]);
  const [theatres, setTheatres] = useState<TheatreOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShowTime, setEditingShowTime] = useState<ShowTime | null>(null);
  const [showTimeToDelete, setShowTimeToDelete] = useState<ShowTime | null>(null);

  const [formData, setFormData] = useState({
    movieId: "",
    hallId: "",
    startTime: "",
    endTime: "",
    basePrice: 1,
  });

  // Filters
  const [filterMovieId, setFilterMovieId] = useState<string>("all");
  const [filterTheatreId, setFilterTheatreId] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [showTimesData, moviesData, theatresData, hallsData] = await Promise.all([
        fetchShowTimes().catch(() => []),
        fetchMovies().catch(() => ({ items: [], data: [] })),
        fetchTheatres().catch(() => []),
        fetchHalls().catch(() => []),
      ]);

      // Normalize movies list early and build movie map for titles
      const moviesList = Array.isArray(moviesData)
        ? moviesData
        : (moviesData as any)?.items || (moviesData as any)?.data || [];
      const movieMap = new Map<string, string>(moviesList.map((m: any) => [m.id, m.originalTitle]));

      // Build lookup maps for theatres and halls so we can enrich showtimes with names
      const theatresList = Array.isArray(theatresData) ? theatresData : [];
      const hallsList = Array.isArray(hallsData) ? hallsData : [];
      const theatreMap = new Map<string, string>(theatresList.map((t: any) => [t.id, t.name]));
      const hallMap = new Map<string, any>(hallsList.map((h: any) => [h.id, h]));

      // Enrich halls with theatreName for the halls select
      const enrichedHalls = hallsList.map((h: any) => ({
        ...h,
        theatreName: theatreMap.get(h.theatreId) ?? undefined,
      }));

      // Enrich showtimes with movieTitle, hallName and theatreName so UI can display human-readable names
      const rawShowTimes = Array.isArray(showTimesData) ? showTimesData : [];
      const enrichedShowTimes = rawShowTimes.map((st: any) => {
        const movieTitle = movieMap.get(st.movieId) ?? st.movieTitle ?? st.movieId;
        const hall = hallMap.get(st.hallId);
        const hallName = hall?.name ?? st.hallName ?? st.hallId;
        const theatreId = st.theatreId ?? hall?.theatreId;
        const theatreName = theatreId ? (theatreMap.get(theatreId) ?? st.theatreName) : st.theatreName;
        return { ...st, movieTitle, hallName, theatreName, theatreId };
      });

      setShowTimes(enrichedShowTimes);
      setMovies(moviesList);
      setTheatres(theatresList);
      setHalls(enrichedHalls);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };


  const handleAdd = () => {
    setEditingShowTime(null);
    setFormData({ movieId: "", hallId: "", startTime: "", endTime: "", basePrice: 1 });
    setDialogOpen(true);
  };

  const handleEdit = (st: ShowTime) => {
    setEditingShowTime(st);
    setFormData({
      movieId: st.movieId,
      hallId: st.hallId,
      startTime: st.startTime ? st.startTime.slice(0, 16) : "",
      endTime: st.endTime ? st.endTime.slice(0, 16) : "",
      basePrice: st.basePrice,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.movieId || !formData.hallId || !formData.startTime || !formData.endTime) {
      toast.error(t("fillAllFields"));
      return;
    }
    setSubmitLoading(true);
    try {
      const payload = {
        movieId: formData.movieId,
        hallId: formData.hallId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        basePrice: formData.basePrice,
      };

      if (editingShowTime) {
        await updateShowTime(editingShowTime.id, payload);
        toast.success(t("save") + " ✓");
      } else {
        await createShowTime(payload);
        toast.success(t("create") + " ✓");
      }
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      console.error("ShowTime save failed", err);
      toast.error(err?.message || t("error"));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!showTimeToDelete) return;
    try {
      await deleteShowTime(showTimeToDelete.id);
      toast.success(t("delete") + " ✓");
      setShowTimeToDelete(null);
      loadData();
    } catch (err: any) {
      console.error("Delete showtime failed", err);
      toast.error(err?.message || t("error"));
    }
  };

  const filteredShowTimes = showTimes.filter((st) => {
    const matchesSearch =
      (st.movieTitle || "").toLowerCase().includes(search.toLowerCase()) ||
      (st.hallName || "").toLowerCase().includes(search.toLowerCase());
    const matchesMovie = filterMovieId === "all" || st.movieId === filterMovieId;
    const matchesTheatre = filterTheatreId === "all" || (st as any).theatreId === filterTheatreId;
    return matchesSearch && matchesMovie && matchesTheatre;
  });

  const formatDateTime = (iso: string) => {
    try {
      return format(new Date(iso), "dd MMM yyyy, HH:mm");
    } catch {
      return iso;
    }
  };

  const columns = [
    {
      key: "movie",
      header: t("movies"),
      render: (st: ShowTime) => (
        <div className="font-medium">{st.movieTitle || st.movieId}</div>
      ),
    },
    {
      key: "hall",
      header: t("halls"),
      render: (st: ShowTime) => (
        <div>
          <span className="font-medium">{st.hallName || st.hallId}</span>
          {st.theatreName && (
            <span className="text-muted-foreground text-xs ml-2">({st.theatreName})</span>
          )}
        </div>
      ),
    },
    {
      key: "startTime",
      header: t("startTime"),
      render: (st: ShowTime) => (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          {formatDateTime(st.startTime)}
        </div>
      ),
    },
    {
      key: "endTime",
      header: t("endTime"),
      render: (st: ShowTime) => (
        <div className="text-sm text-muted-foreground">{formatDateTime(st.endTime)}</div>
      ),
    },
    {
      key: "basePrice",
      header: t("basePrice"),
      render: (st: ShowTime) => (
        <div className="flex items-center gap-1 font-semibold">
          <DollarSign className="w-3.5 h-3.5 text-primary" />
          {st.basePrice.toFixed(2)}
        </div>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      render: (st: ShowTime) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(st)} className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTimeToDelete(st)}
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
      <PageHeader title={t("showTimes")} onAdd={handleAdd}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-52"
            />
          </div>
          <Select value={filterMovieId} onValueChange={setFilterMovieId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("movies")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("movies")} ({t("allItems")})</SelectItem>
              {movies.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.originalTitle}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTheatreId} onValueChange={setFilterTheatreId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("theatres")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("theatres")} ({t("allItems")})</SelectItem>
              {theatres.map((th) => (
                <SelectItem key={th.id} value={th.id}>{th.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {loading ? (
        <div className="p-6 text-center text-muted-foreground">Loading...</div>
      ) : (
        <DataTable columns={columns} data={filteredShowTimes} keyExtractor={(st) => st.id} />
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingShowTime ? t("edit") : t("create")} {t("showTimes")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{t("movies")} *</Label>
              <Select value={formData.movieId} onValueChange={(v) => setFormData({ ...formData, movieId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t("movies")} /></SelectTrigger>
                <SelectContent>
                  {movies.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.originalTitle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t("halls")} *</Label>
              <Select value={formData.hallId} onValueChange={(v) => setFormData({ ...formData, hallId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t("halls")} /></SelectTrigger>
                <SelectContent>
                  {halls.length > 0 ? halls.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name} {h.theatreName ? `(${h.theatreName})` : ''}
                    </SelectItem>
                  )) : (
                    <SelectItem value="__none" disabled>{t("noData")}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("startTime")} *</Label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{t("endTime")} *</Label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>{t("basePrice")} *</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleSubmit} className="cinema-gradient" disabled={submitLoading}>
              {submitLoading ? "..." : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!showTimeToDelete} onOpenChange={() => setShowTimeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirmDelete")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

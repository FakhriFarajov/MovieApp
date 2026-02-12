import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Search, Edit, Trash2, Clock, Calendar, User } from "lucide-react";
import { fetchMovies, createMovie, updateMovie, deleteMovie, fetchGenres, getMovieById } from "@/api/api";
import { uploadImage } from "@/shared/utils/imagePost";
import { Movie, MovieStatus } from "@/types";
import { toast } from "sonner";

export function MoviesPage() {
  const { t } = useLanguage();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [formData, setFormData] = useState<Partial<Movie>>({
    originalTitle: '', overview: '', director: '', duration: '', ageRestriction: '', releaseDate: '',
    posterPath: '', backdropPath: '', videoUrl: '', isForAdult: false, video: false,
    genreIds: [], actors: [], languages: ['en'], originalLanguage: 'en',
    // new fields
    homePageUrl: '', status: undefined, budget: 0 as any, revenue: 0 as any, tagLine: '',
    averageRating: 0 as any,
  });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [backdropPreview, setBackdropPreview] = useState<string | null>(null);
  // Keep raw input strings to avoid cursor jump when typing commas/spaces
  const [actorsInput, setActorsInput] = useState<string>((formData.actors || []).join(', '));
  const [languagesInput, setLanguagesInput] = useState<string>((formData.languages || ['en']).join(', '));
  const [submitLoading, setSubmitLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [genresMap, setGenresMap] = useState<Record<string, string>>({});
  const [genres, setGenres] = useState<any[]>([]);

  const filteredMovies = movies.filter((m) =>
    (m.originalTitle ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (m.director ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedMovie(null);
    setFormData({
      originalTitle: '', overview: '', director: '', duration: '', ageRestriction: '', releaseDate: '',
      posterPath: '', backdropPath: '', videoUrl: '', isForAdult: false, video: false,
      genreIds: [], actors: [], languages: ['en'], originalLanguage: 'en',
      homePageUrl: '', status: undefined, budget: 0 as any, revenue: 0 as any, tagLine: '',
      averageRating: 0 as any,
    });
    setPosterPreview(null);
    setBackdropPreview(null);
    setActorsInput('');
    setLanguagesInput('en');
    setDialogOpen(true);
  };

  const handleEdit = async (movie: Movie) => {
    setSelectedMovie(movie);
    setPosterFile(null);
    setBackdropFile(null);
    try {
      const data = await getMovieById(movie.id).catch(() => null);
      console.log('getMovieById', movie.id, data);
      if (data) {
        setFormData({
          originalTitle: data.title ?? data.originalTitle ?? movie.originalTitle ?? '',
          overview: data.overview ?? movie.overview ?? '',
          director: data.director ?? movie.director ?? '',
          duration: data.duration ?? movie.duration ?? '',
          ageRestriction: data.ageRestriction ?? movie.ageRestriction ?? '',
          releaseDate: data.releaseDate ? String(data.releaseDate).split('T')[0] : (movie.releaseDate ?? ''),
          posterPath: data.posterPath ?? movie.posterPath ?? '',
          backdropPath: data.backdropPath ?? movie.backdropPath ?? '',
          videoUrl: data.videoUrl ?? movie.videoUrl ?? '',
          isForAdult: !!(data.isForAdult ?? movie.isForAdult),
          video: data.video ?? movie.video ?? false,
          genreIds: data.genreIds ?? movie.genreIds ?? [],
          actors: data.actors ?? movie.actors ?? [],
          languages: data.languages ?? movie.languages ?? ['en'],
          originalLanguage: data.originalLanguage ?? movie.originalLanguage ?? 'en',
          // new fields
          homePageUrl: data.homePageUrl ?? movie.homePageUrl ?? '',
          status: (data.status ?? movie.status) as MovieStatus ?? undefined,
          budget: data.budget ?? movie.budget ?? 0,
          revenue: data.revenue ?? movie.revenue ?? 0,
          tagLine: data.tagLine ?? movie.tagLine ?? '',
          averageRating: data.averageRating ?? movie.averageRating ?? 0,
        });
        setPosterPreview(data.posterPath ?? movie.posterPath ?? null);
        setBackdropPreview(data.backdropPath ?? movie.backdropPath ?? null);
        // populate raw input strings to preserve typing experience
        setActorsInput((data.actors ?? movie.actors ?? []).join(', '));
        setLanguagesInput((data.languages ?? movie.languages ?? ['en']).join(', '));
      } else {
        setFormData({ ...movie });
        // ensure optional new fields exist on fallback
        setFormData(prev => ({ ...prev, homePageUrl: (movie as any).homePageUrl ?? '', status: (movie as any).status ?? undefined, budget: (movie as any).budget ?? 0, revenue: (movie as any).revenue ?? 0, tagLine: (movie as any).tagLine ?? '' }));
        setPosterPreview(movie.posterPath || null);
        setBackdropPreview(movie.backdropPath || null);
        setActorsInput((movie.actors || []).join(', '));
        setLanguagesInput((movie.languages || ['en']).join(', '));
      }
    } catch (err) {
      console.error('Failed to fetch movie details', err);
      toast.error('Failed to load movie details');
      setFormData({ ...movie });
      setPosterPreview(movie.posterPath || null);
      setBackdropPreview(movie.backdropPath || null);
      setActorsInput((movie.actors || []).join(', '));
      setLanguagesInput((movie.languages || ['en']).join(', '));
    } finally {
      setDialogOpen(true);
    }
  };

  const handleDelete = (movie: Movie) => {
    setSelectedMovie(movie);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.originalTitle || !formData.director) return;
    setSubmitLoading(true);
    try {
      // Upload poster/backdrop if files selected
      let posterPath = formData.posterPath;
      let backdropPath = formData.backdropPath;
      // helper to extract objectName from various upload responses
      const extractObjectName = (r: any) => {
        if (!r) return '';
        if (typeof r === 'string') return r;
        if (r.objectName) return r.objectName;
        if (r.data && typeof r.data === 'string') return r.data;
        if (r.data?.objectName) return r.data.objectName;
        if (r.data?.data?.objectName) return r.data.data.objectName;
        if (r.data?.object?.objectName) return r.data.object.objectName;
        if (r.object?.objectName) return r.object.objectName;
        return '';
      };

      if (posterFile) {
        try {
          const res = await uploadImage(posterFile);
          const name = extractObjectName(res);
          if (!name) throw new Error('Upload did not return object name');
          posterPath = name;
        } catch (err) {
          console.error('Poster upload failed', err);
          toast.error('Poster upload failed');
          throw err;
        }
      }
      if (backdropFile) {
        try {
          const res = await uploadImage(backdropFile);
          const name = extractObjectName(res);
          if (!name) throw new Error('Upload did not return object name');
          backdropPath = name;
        } catch (err) {
          console.error('Backdrop upload failed', err);
          toast.error('Backdrop upload failed');
          throw err;
        }
      }

      // ensure we use latest parsed actors/languages from input strings
      const parsedActors = (actorsInput || '').split(',').map(a => a.trim()).filter(Boolean);
      const parsedLanguages = (languagesInput || '').split(',').map(l => l.trim()).filter(Boolean);

      // Build payload matching API shape
      const apiPayload = {
        // include both keys to satisfy backends expecting either
        title: formData.originalTitle || "",
        originalTitle: formData.originalTitle || "",
        isForAdult: !!formData.isForAdult,
        backdropPath: backdropPath || formData.backdropPath || "",
        genreIds: formData.genreIds || [],
        originalLanguage: formData.originalLanguage || "",
        languages: parsedLanguages.length ? parsedLanguages : (formData.languages || []),
        overview: formData.overview || "",
        posterPath: posterPath || formData.posterPath || "",
        duration: formData.duration || "",
        ageRestriction: formData.ageRestriction || "",
        releaseDate: formData.releaseDate || null,
        video: !!formData.video,
        videoUrl: formData.videoUrl || "",
        actors: parsedActors.length ? parsedActors : (formData.actors || []),
        director: formData.director || "",
        // new fields
        homePageUrl: formData.homePageUrl || "",
        status: formData.status || "",
        budget: Number(formData.budget) || 0,
        revenue: Number(formData.revenue) || 0,
        tagLine: formData.tagLine || "",
        averageRating: isFinite(Number(formData.averageRating)) ? parseFloat(String(formData.averageRating)) : 0,
      } as any;

      if (selectedMovie) {
        console.log('Updating movie', selectedMovie.id, apiPayload);
        const res = await updateMovie(selectedMovie.id, apiPayload).catch((e) => { console.error('updateMovie error', e); throw e; });
        console.log('updateMovie response', res);
        // Refresh full list from server to get authoritative data
        try {
          const listData = await fetchMovies({ page: 1, pageSize: 50 });
          console.log('fetchMovies after update returned', listData);
          let items: any[] = [];
          if (!listData) items = [];
          else if (Array.isArray(listData)) items = listData;
          else if (listData.data) items = listData.data;
          else if (listData.results) items = listData.results;
          else if (listData.items) items = listData.items;
          else items = Array.isArray(listData) ? listData : [];
          const normalized = items.map(normalizeMovie);
          console.log('Normalized list length', normalized.length);
          setMovies(normalized as Movie[]);
        } catch (err) {
          console.error('Failed to refresh list after update', err);
          // fallback: update local item with payload
          setMovies((prev) => prev.map(m => m.id === selectedMovie.id ? ({ ...m, ...apiPayload } as Movie) : m));
        }
        toast.success(`Movie updated successfully${res?.id ? ' (id: ' + res.id + ')' : ''}`);
      } else {
        console.log('Creating movie', apiPayload);
        const res = await createMovie(apiPayload).catch((e) => { console.error('createMovie error', e); throw e; });
        console.log('createMovie response', res);
        // Refresh full list from server to include newly created movie
        try {
          const listData = await fetchMovies({ page: 1, pageSize: 50 });
          console.log('fetchMovies after create returned', listData);
          let items: any[] = [];
          if (!listData) items = [];
          else if (Array.isArray(listData)) items = listData;
          else if (listData.data) items = listData.data;
          else if (listData.results) items = listData.results;
          else if (listData.items) items = listData.items;
          else items = Array.isArray(listData) ? listData : [];
          const normalized = items.map(normalizeMovie);
          setMovies(normalized as Movie[]);
        } catch (err) {
          console.error('Failed to refresh list after create', err);
          // fallback: append payload locally
          const createdId = `m${Date.now()}`;
          setMovies((prev) => [...prev, normalizeMovie({ id: createdId, ...apiPayload }) as Movie]);
        }
        toast.success(`Movie created successfully${res?.id ? ' (id: ' + res.id + ')' : ''}`);
      }
      setDialogOpen(false);
    } catch (err: any) {
      console.error('Save movie failed', err);
      toast.error(err?.message || 'Failed to save movie');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedMovie) return;
    (async () => {
      try {
        await deleteMovie(selectedMovie.id);
        setMovies((prev) => prev.filter(m => m.id !== selectedMovie.id));
        toast.success('Movie deleted successfully');
        setDeleteDialogOpen(false);
      } catch (err: any) {
        console.error('Delete movie failed', err);
        toast.error(err?.message || 'Failed to delete movie');
      }
    })();
  };

  const getGenreNames = (genreIds: string[]) => {
    return genreIds.map(id => genresMap[id] || id).filter(Boolean).join(', ');
  };

  // normalize movies returned by API to ensure UI fields exist (some APIs return `title` instead of `originalTitle`, etc.)
  const normalizeMovie = (m: any): Movie => ({
    id: m.id,
    originalTitle: m.originalTitle ?? m.title ?? '',
    overview: m.overview ?? '',
    director: m.director ?? '',
    duration: m.duration ?? '',
    ageRestriction: m.ageRestriction ?? '',
    releaseDate: m.releaseDate ? String(m.releaseDate).split('T')[0] : (m.releaseDate ?? ''),
    posterPath: m.posterPath ?? m.poster ?? '',
    backdropPath: m.backdropPath ?? m.backdrop ?? '',
    videoUrl: m.videoUrl ?? m.videoUri ?? '',
    isForAdult: !!(m.isForAdult ?? false),
    video: !!(m.video ?? !!m.videoUrl),
    genreIds: m.genreIds ?? m.genres ?? [],
    actors: Array.isArray(m.actors) ? m.actors : (m.actors ? String(m.actors).split(',').map((s:string)=>s.trim()).filter(Boolean) : []),
    languages: Array.isArray(m.languages) ? m.languages : (m.languages ? String(m.languages).split(',').map((s:string)=>s.trim()).filter(Boolean) : ['en']),
    originalLanguage: m.originalLanguage ?? 'en',
    // new fields
    homePageUrl: m.homePageUrl ?? '',
    status: m.status ?? undefined,
    budget: m.budget ?? 0,
    revenue: m.revenue ?? 0,
    tagLine: m.tagLine ?? '',
    averageRating: m.averageRating ?? 0,
  });

  // load movies on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchMovies({ page: 1, pageSize: 50 });
        if (!mounted) return;
        // handle multiple response shapes
        let items: any[] = [];
        if (!data) items = [];
        else if (Array.isArray(data)) items = data;
        else if (data.data) items = data.data;
        else if (data.results) items = data.results;
        else if (data.items) items = data.items;
        else items = Array.isArray(data) ? data : [];
        // Use the items returned by the list endpoint directly.
        // Full per-movie details are fetched when opening the edit dialog (handleEdit).
        const normalized = items.map(normalizeMovie);
        setMovies(normalized as Movie[]);
      } catch (err: any) {
        console.error('Failed to load movies', err);
        toast.error(err?.message || 'Failed to fetch movies');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // load genres map on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchGenres();
        if (!mounted) return;
        if (Array.isArray(data)) {
          const map: Record<string, string> = {};
          data.forEach((g: any) => { if (g?.id) map[g.id] = g.name || g.id; });
          setGenresMap(map);
          setGenres(data);
        }
      } catch (err) {
        console.error('Failed to load genres', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // cleanup previews & files when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      try {
        if (posterPreview && posterFile) URL.revokeObjectURL(posterPreview);
      } catch {}
      try {
        if (backdropPreview && backdropFile) URL.revokeObjectURL(backdropPreview);
      } catch {}
      setPosterFile(null);
      setBackdropFile(null);
      setPosterPreview(null);
      setBackdropPreview(null);
    }
  }, [dialogOpen]);

  return (
    <div>
      <PageHeader title={t('movies')} onAdd={handleAdd}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-64" />
        </div>
      </PageHeader>

      {/* Movie Grid */}
      {loading ? (
        <div className="p-6 text-center text-muted-foreground">Loading movies...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => (
            <div key={movie.id} className="cinema-card overflow-hidden group">
              <div className="relative aspect-[2/3] bg-muted">
                <img
                  src={movie.posterPath}
                  alt={movie.originalTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(movie)} className="flex-1">
                      <Edit className="w-4 h-4 mr-1" /> {t('edit')}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(movie)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {movie.isForAdult && (
                  <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">18+</span>
                )}
                <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">{movie.ageRestriction}</span>
              </div>
              <div className="p-4">
                <h3 className="font-display font-semibold text-lg truncate">{movie.originalTitle}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{movie.director || '-'}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{movie.duration}</span>
                  {movie.releaseDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{movie.releaseDate}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{getGenreNames(movie.genreIds)}</p>

                {/* New: show actors list if available */}
                {movie.actors && movie.actors.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">Actors: {movie.actors.join(', ')}</p>
                )}

                {/* New: show video link if present */}
                {movie.video && movie.videoUrl && (
                  <div className="mt-2">
                    <a href={movie.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">Watch video</a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredMovies.length === 0 && !loading && (
        <div className="cinema-card p-12 text-center">
          <p className="text-muted-foreground">{t('noData')}</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMovie ? t('edit') : t('create')} Movie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('title')} *</Label>
                <Input value={formData.originalTitle} onChange={(e) => setFormData({ ...formData, originalTitle: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>{t('director')} *</Label>
                <Input value={formData.director} onChange={(e) => setFormData({ ...formData, director: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>{t('overview')}</Label>
              <Textarea value={formData.overview} onChange={(e) => setFormData({ ...formData, overview: e.target.value })} className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t('duration')}</Label>
                <Input type="time" step="1" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>{t('releaseDate')}</Label>
                <Input type="date" value={formData.releaseDate} onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>{t('ageRestriction')}</Label>
                <Input
                  value={formData.ageRestriction}
                  onChange={(e) => {
                    const v = e.target.value;
                    // try to extract first number from the string (e.g. '13' from 'PG-13')
                    const m = v.match(/\d+/);
                    const n = m ? Number(m[0]) : undefined;
                    // if numeric age provided, mark isForAdult = n >= 18, otherwise keep current value
                    setFormData({ ...formData, ageRestriction: v, isForAdult: n !== undefined ? (n >= 18) : formData.isForAdult });
                  }}
                  className="mt-1"
                  placeholder="PG-13, R, etc."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Poster (upload)</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setPosterFile(f);
                    if (f) {
                      const url = URL.createObjectURL(f);
                      setPosterPreview(url);
                    } else {
                      setPosterPreview(formData.posterPath || null);
                    }
                  }}
                  className="mt-2"
                />
                {posterPreview && (
                  <img src={posterPreview} alt="poster" className="mt-2 w-32 h-48 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                )}
              </div>
              <div>
                <Label>Backdrop (upload)</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setBackdropFile(f);
                    if (f) {
                      const url = URL.createObjectURL(f);
                      setBackdropPreview(url);
                    } else {
                      setBackdropPreview(formData.backdropPath || null);
                    }
                  }}
                  className="mt-2"
                />
                {backdropPreview && (
                  <img src={backdropPreview} alt="backdrop" className="mt-2 w-full h-24 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label>Genres</Label>
                <select
                  multiple
                  size={Math.min(8, Math.max(4, genres.length))}
                  value={(formData.genreIds as string[]) || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                    setFormData({ ...formData, genreIds: selected });
                  }}
                  className="mt-1 block w-full rounded-md border bg-transparent px-3 py-2"
                >
                  {genres.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name || g.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Original Language</Label>
                <Input value={formData.originalLanguage} onChange={(e) => setFormData({ ...formData, originalLanguage: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label>Languages (comma-separated)</Label>
                <Input
                  value={languagesInput}
                  onChange={(e) => setLanguagesInput(e.target.value)}
                  onBlur={() => setFormData({ ...formData, languages: languagesInput.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Video URL</Label>
                <Input value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value, video: !!e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label>Home Page URL</Label>
                <Input value={(formData.homePageUrl as string) || ''} onChange={(e) => setFormData({ ...formData, homePageUrl: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Tagline</Label>
                <Input value={(formData.tagLine as string) || ''} onChange={(e) => setFormData({ ...formData, tagLine: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label>Status</Label>
                <select
                  value={(formData.status as MovieStatus) ?? ''}
                  onChange={(e) => setFormData({ ...formData, status: (e.target.value as MovieStatus) })}
                  className="mt-1 block w-full rounded-md border bg-transparent px-3 py-2"
                >
                  <option value="">(none)</option>
                  <option value="Rumored">Rumored</option>
                  <option value="Planned">Planned</option>
                  <option value="In Production">In Production</option>
                  <option value="Post Production">Post Production</option>
                  <option value="Released">Released</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>
              <div>
                <Label>Budget</Label>
                <Input type="number" value={String(formData.budget ?? '')} onChange={(e) => setFormData({ ...formData, budget: e.target.value === '' ? 0 : Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <Label>Revenue</Label>
                <Input type="number" value={String(formData.revenue ?? '')} onChange={(e) => setFormData({ ...formData, revenue: e.target.value === '' ? 0 : Number(e.target.value) })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-2">
              <div>
                <Label>Average Rating</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={String(formData.averageRating ?? '')}
                  onChange={(e) => setFormData({ ...formData, averageRating: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Actors (comma-separated)</Label>
              <Input
                value={actorsInput}
                onChange={(e) => setActorsInput(e.target.value)}
                onBlur={() => setFormData({ ...formData, actors: actorsInput.split(',').map(a => a.trim()).filter(Boolean) })}
                className="mt-1"
              />
            </div>
            {/* isForAdult and video are derived: isForAdult is set from ageRestriction (>=18), video is true when videoUrl is present */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleSubmit} disabled={!formData.originalTitle || !formData.director || submitLoading} className="cinema-gradient">{submitLoading ? '...' : t('save')}</Button>
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
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

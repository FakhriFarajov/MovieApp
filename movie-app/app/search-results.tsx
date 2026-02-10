import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, Sliders, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addBookmark, deleteBookmark, fetchBookmarks } from '../app/api/bookmarks.api';
import { searchMovies } from '../app/api/movies.api';
import { usePaginatedFetch } from '../app/api/usePaginatedFetch';
import { SortBy } from '../app/types/genresList';
const SORT_OPTIONS = [
  { label: 'Popularity Desc', value: SortBy.PopularityDesc },
  { label: 'Popularity Asc', value: SortBy.PopularityAsc },
  { label: 'Title Asc', value: SortBy.TitleAsc },
  { label: 'Title Desc', value: SortBy.TitleDesc },
  { label: 'Vote Average Desc', value: SortBy.VoteAverageDesc },
  { label: 'Vote Average Asc', value: SortBy.VoteAverageAsc },
];

export default function SearchResults() {
  const { colorScheme } = useTheme();
  const styles = getStyles(colorScheme as 'light' | 'dark');
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryTitle = params.movieName as string | undefined;
  const genreIdsQuery = params.genreIds as string | undefined;

  // saved items keyed by string (backend may return GUIDs)
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const toggleSaved = async (id: string) => {
    const currently = !!saved[String(id)];
    // optimistic UI update
    setSaved((prev) => ({ ...prev, [id]: !currently }));
    try {
      if (!currently) {
        // add bookmark - API will resolve clientId from token if not provided
        const res: any = await addBookmark(String(id));
        // if backend returns created bookmark, we could store its id elsewhere; for now boolean saved is enough
      } else {
        // remove bookmark - need to resolve bookmark id first
        let bookmarkIdToDelete: string | null = null;
        try {
          const list: any = await fetchBookmarks();
          const arr = Array.isArray(list) ? list : [];
          const found = arr.find((b: any) => {
            const movie = b.movie ?? b;
            const mid = movie?.id ?? movie?.movieId ?? movie?.movie_id ?? null;
            return String(mid) === String(id);
          });
          if (found) bookmarkIdToDelete = found.id ?? found.bookmarkId ?? found.bookmark_id ?? null;
        } catch (innerErr) {
          console.warn('Failed to resolve bookmark id before delete', innerErr);
        }

        if (bookmarkIdToDelete) {
          await deleteBookmark(undefined, String(bookmarkIdToDelete));
        } else {
          // fallback: attempt delete by id directly
          await deleteBookmark(undefined, String(id));
        }
      }
    } catch (e) {
      console.warn('bookmark update failed', e);
      // revert UI
      setSaved((prev) => ({ ...prev, [id]: currently }));
      Alert.alert('Bookmark', 'Could not update bookmark.');
    }
  };

  // load user's bookmarks to reflect saved state
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchBookmarks();
        const list = Array.isArray(res) ? res : [];
        const map: Record<string, boolean> = {};
        list.forEach((raw: any) => {
          const movie = raw.movie ?? raw;
          const mid = movie?.id ?? movie?.movieId ?? movie?.movie_id ?? null;
          if (mid) map[String(mid)] = true;
        });
        if (mounted) setSaved(map);
      } catch (e) {
        console.warn('failed to load bookmarks', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Sorting
  const [sort, setSort] = useState<SortBy>(SortBy.PopularityDesc);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const PAGE_SIZE = 20;

  // Paginated fetch using the Movies search endpoint
  const {
    data: movies,
    loading,
    nextPage,
    reset,
    refetchPage,
  } = usePaginatedFetch<any>(
    async (p) => {
      const page = p;
      // call searchMovies and map response to PaginatedResult<T>
      const query = queryTitle?.trim() ? queryTitle : null;
      const genreId = genreIdsQuery ? genreIdsQuery.split(',')[0] : null;
      const res = await searchMovies({ lang: '', page, pageSize: PAGE_SIZE, query, genreId });

      // backend returns { items: T[], total, page, pageSize }
      if (!res) return { results: [], total_pages: 1, total_results: 0 };
      const items = res.items ?? res.results ?? [];
      const total = Number(res.total ?? res.total_results ?? 0);
      const pageSize = Number(res.pageSize ?? res.page_size ?? PAGE_SIZE);
      const total_pages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
      return { results: items, total_pages, total_results: total };
    },
    [queryTitle, genreIdsQuery, sort] // keep dependency so changing sort triggers refetch
  );

  // If API returns per-item `isInBookmark`, use it to seed saved state whenever `movies` changes
  React.useEffect(() => {
    if (!Array.isArray(movies) || movies.length === 0) return;
    setSaved(prev => {
      const next = { ...prev };
      (movies as any[]).forEach(m => {
        if (m && typeof m.isInBookmark === 'boolean') {
          next[String(m.id)] = !!m.isInBookmark;
        }
      });
      return next;
    });
  }, [movies]);

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      reset();
      if (typeof refetchPage === 'function') {
        await refetchPage(1);
      }
    } catch (e) {
      console.warn('refresh error', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Layout
  const WINDOW = Dimensions.get('window');
  const H_PAD = 32;
  const GAP = 20;
  const COLUMN_WIDTH = Math.floor((WINDOW.width - H_PAD - GAP) / 2);
  const MAX_CELL_WIDTH = Math.floor(COLUMN_WIDTH );

  return (
    <LinearGradient
      colors={
        colorScheme === "dark"
          ? layoutTheme.colors.gradients.darkPrimary as any
          : layoutTheme.colors.gradients.lightPrimary as any
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <ArrowLeft color="#fff" />
          </TouchableOpacity>
          <Text style={styles.header}>Results</Text>
          <TouchableOpacity onPress={() => setSidebarVisible(true)} style={{ marginLeft: 'auto' }}>
            <Sliders color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sub}>
          {Array.isArray(movies) ? movies.length : 0} result(s){queryTitle ? ` for "${queryTitle}"` : ''}
        </Text>

        {/* Movies List */}
        <FlatList
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          data={Array.isArray(movies) ? movies : []}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          onEndReached={nextPage}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListFooterComponent={loading ? <ActivityIndicator color="#fff" style={{ margin: 16 }} /> : null}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>No results</Text> : null}
          renderItem={({ item }) => {
            // support both backend shapes: posterPath (full URL) or poster_path (TMDB path)
            const poster = item.posterPath
              ? item.posterPath
              : item.poster_path
              ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
              : undefined;

            const title = item.title ?? item.name ?? 'Untitled';
            const ratingNum = Number(item.vote_average ?? item.voteAverage ?? 0);

            return (
              <View style={{ marginBottom: 14, maxWidth: MAX_CELL_WIDTH }}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/movie-details',
                      params: { movie_id: String(item.id) },
                    })
                  }
                >
                  {poster ? (
                    <Image source={{ uri: poster }} style={styles.poster} />
                  ) : (
                    <View style={[styles.poster, { alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ color: '#fff' }}>No Image</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.titleRow}>
                  <Text numberOfLines={1} style={styles.title}>{title}</Text>
                  <TouchableOpacity onPress={() => toggleSaved(String(item.id))} style={styles.bookmark}>
                    <Bookmark size={16} color={saved[String(item.id)] ? '#FFD369' : '#fff'} />
                  </TouchableOpacity>
                </View>

                <View style={styles.ratingRow}>
                  <Star size={14} fill="#FFD369" color={"transparent"}/>
                  <Text style={styles.rating}>{ratingNum.toFixed(1)}</Text>
                </View>
              </View>
            );
          }}
        />
        
        
        {/* ---------------- Sidebar Modal for Sorting ---------------- */}
        <Modal
          visible={sidebarVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setSidebarVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setSidebarVisible(false)}
          >
            <View style={styles.sidebar}>
              <Text style={styles.sidebarHeader}>Sort By</Text>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.sortOption, sort === opt.value && styles.sortOptionActive]}
                  onPress={() => {
                    if (sort !== opt.value) {
                      setSort(opt.value);       // Update sort
                      reset();        // Clear movies & reset page
                      setSidebarVisible(false); // Close sidebar
                    }
                  }}
                >
                  <Text style={[styles.sortText, sort === opt.value && styles.sortTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Optional Reset Button */}
              <TouchableOpacity
                style={[styles.sortOption, { marginTop: 12, backgroundColor: '#444' }]}
                onPress={() => {
                  setSort(SortBy.PopularityDesc); // Reset to default
                  reset();              // Clear movies & reset page
                }}
              >
                <Text style={[styles.sortText, { fontWeight: '700', color: '#fff' }]}>
                  Reset Sort
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const mode = (layoutTheme.modes as any)[colorScheme] ?? layoutTheme.modes.dark;
  const primary = mode.text?.primary ?? '#fff';
  const muted = mode.text.primary ?? 'rgba(255, 255, 255, 1)';
  const bgFade = colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

  return StyleSheet.create({
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12 },
    header: { color: primary, fontSize: 22, fontWeight: '800', marginLeft: 8 },
    sub: { color: muted, marginTop: 6, marginBottom: 12 },
    poster: { width: '100%', aspectRatio: 0.7, borderRadius: 10, backgroundColor: bgFade },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' },
    title: { color: primary, fontSize: 14, fontWeight: '700', flex: 1 },
    bookmark: { padding: 6, borderRadius: 20, backgroundColor: bgFade, marginLeft: 6 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    rating: { color: primary, marginLeft: 6, fontSize: 12, fontWeight: '700' },
    empty: { color: muted, textAlign: 'center', marginTop: 20 },

    // Sidebar / Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sidebar: { backgroundColor: mode.surface ?? '#120726', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    sidebarHeader: { color: primary, fontSize: 18, fontWeight: '700', marginBottom: 12 },
    sortOption: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
    sortOptionActive: { backgroundColor: (layoutTheme.colors as any).accent?.[500] ?? '#7c3aed' },
    sortText: { color: primary, fontSize: 14 },
    sortTextActive: { fontWeight: '700', color: primary },
  });
};

import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiCallWithManualRefresh } from '@/shared/apiWithManualRefresh';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, Sliders, Star } from 'lucide-react-native';
import React, { useState } from 'react';
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
import { addBookmark, deleteBookmark } from './api/bookmarks/bookmarks.api';
import { searchByNameOrGenre } from './api/movies/movies.api';

const SORT_OPTIONS = [
  { label: 'Popularity Desc', value: 'popularity.desc' },
  { label: 'Popularity Asc', value: 'popularity.asc' },
  { label: 'Title Asc', value: 'title.asc' },
  { label: 'Title Desc', value: 'title.desc' },
  { label: 'Vote Average Desc', value: 'vote_average.desc' },
  { label: 'Vote Average Asc', value: 'vote_average.asc' },
];

export default function SearchResults() {
  const { colorScheme } = useTheme();
  const styles = getStyles(colorScheme as 'light' | 'dark');
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryTitle = params.movieName as string | undefined;

  const genreIdsQuery = params.genreIds as string | undefined;


  const [saved, setSaved] = useState<Record<string, boolean>>({});

  // Sorting
  const [sort, setSort] = useState<string>('popularity.desc');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const PAGE_SIZE = 20;

  // Local paginated fetch implementation (replaces usePaginatedFetch)
  const [movies, setMovies] = React.useState<any[]>([]);
  const [page, setPage] = React.useState<number>(1);
  const [totalPages, setTotalPages] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [loadingMore, setLoadingMore] = React.useState<boolean>(false);
  const [error, setError] = React.useState<any>(null);

  const fetchPage = async (p: number) => {
    if (p === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const res: any = await apiCallWithManualRefresh(() => searchByNameOrGenre({ lang: '', page: p, pageSize: PAGE_SIZE, query: queryTitle ?? null, genreId: genreIdsQuery ? genreIdsQuery.split(',')[0] : null }));
      const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
      if (p === 1) setMovies(items);
      else setMovies(prev => [...prev, ...items]);
      const tp = Math.ceil((res?.total ?? 0) / (res?.pageSize ?? PAGE_SIZE));
      setTotalPages(Number.isFinite(tp) && tp > 0 ? tp : null);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // initial & genre change
  React.useEffect(() => {
    setPage(1);
    fetchPage(1);
  }, [genreIdsQuery]);

  const nextPage = React.useCallback(() => {
    if (loadingMore) return;
    if (totalPages !== null && page >= totalPages) return;
    const np = page + 1;
    setPage(np);
    fetchPage(np);
  }, [page, totalPages, loadingMore, genreIdsQuery]);

  const reset = React.useCallback(() => {
    setPage(1);
    setMovies([]);
    setTotalPages(null);
    fetchPage(1);
  }, [genreIdsQuery]);

  const refetchPage = React.useCallback(async (p: number) => {
    setPage(p);
    await fetchPage(p);
  }, [genreIdsQuery]);

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

  const toggleSaved = async (id: string) => {
    const currently = !!saved[id];
    setSaved(prev => ({ ...prev, [id]: !currently }));
    try {
      if (!currently) {
        await apiCallWithManualRefresh(() => addBookmark(id));
      } else {
        await apiCallWithManualRefresh(() => deleteBookmark(id));
      }
    } catch (e) {
      setSaved(prev => ({ ...prev, [id]: currently }));
      Alert.alert('Error', 'Could not update bookmark');
      console.warn('bookmark error', e);
    }
  };

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
            const poster = item.posterPath ?? item.poster_path;
            const title = item.title ?? item.name ?? 'Untitled';
            const ratingNum = Number(item.averageRating ?? item.vote_average ?? item.voteAverage ?? 0);

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
                  setSort('popularity.desc'); // Reset to default
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

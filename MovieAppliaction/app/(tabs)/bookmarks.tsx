import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiCallWithManualRefresh } from '@/shared/apiWithManualRefresh';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bookmark } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteBookmark, fetchBookmarks } from '../api/bookmarks/bookmarks.api';

export default function Bookmarks() {
  const { colorScheme } = useTheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const normalize = (raw: any) => {
    // raw may be a bookmark record { id, movieId, movie } or a movie object directly
    const movie = raw.movie ?? raw;
    const bookmarkId = raw.id ?? raw.bookmarkId ?? null;
    const movieId = raw.movieId ?? movie?.id ?? movie?.movieId ?? movie?.movie_id ?? String(Math.random());
    return {
      bookmarkId,
      movieId,
      id: movie?.id ?? movie?.movieId ?? movie?.movie_id ?? String(Math.random()),
      title: movie?.title ?? movie?.name ?? movie?.original_title ?? 'Untitled',
      overview: movie?.overview ?? '',
      posterPath: movie?.posterPath,
      backdropPath: movie?.backdropPath,
      genres: movie?.genres ?? [],
      averageRating: movie?.averageRating ?? movie?.vote_average ?? 0,
    };
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiCallWithManualRefresh(() => fetchBookmarks());
      const list = Array.isArray(res) ? res : [];
      setItems(list.map(normalize));
    } catch (e: any) {
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await apiCallWithManualRefresh(() => fetchBookmarks());
      const list = Array.isArray(res) ? res : [];
      setItems(list.map(normalize));
    } catch (e: any) {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, []);

  const removeItem = async (movieId: string) => {
    // Delete by movieId (backend expects movie identifier) and update UI optimistically
    try {
      await apiCallWithManualRefresh(() => deleteBookmark(String(movieId)));
      setItems((prev) => prev.filter((i) => i.movieId !== movieId));
    } catch (e) {
      console.warn('delete failed', e);
      Alert.alert('Failed', 'Could not remove bookmark');
    }
  };

  const clearAll = () => {
    Alert.alert('Clear bookmarks', 'Remove all bookmarks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            for (const it of items) {
              try {
                // delete by movie id
                await apiCallWithManualRefresh(() => deleteBookmark(String(it.movieId)));
              } catch (e) {
                // ignore individual failures
              }
            }
            setItems([]);
          } catch (e) {
            Alert.alert('Failed', 'Could not clear bookmarks');
          }
        },
      },
    ]);
  };

  const openDetails = (item: any) => {
    try {
      router.push({ pathname: '/movie-details', params: { movie_id: String(item.id) } });
    } catch (e) {
      // ignore
    }
  };

  return (
    <LinearGradient colors={
      colorScheme === 'dark'
        ? layoutTheme.colors.gradients.darkPrimary as any
        : layoutTheme.colors.gradients.lightPrimary as any
    } start={{ x: 0.9, y: 0.05 }} end={{ x: 0.9, y: 0.9 }} style={{ flex: 1, width: '100%' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Bookmarks</Text>
          <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ScrollView
            contentContainerStyle={{ flex: 1, padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
                colors={['#7c3aed']}
              />
            }
          >
            <Text style={{ color: '#9b9bb0' }}>Loading...</Text>
          </ScrollView>
        ) : items.length === 0 ? (
          <ScrollView
            contentContainerStyle={{ flex: 1, padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
                colors={['#7c3aed']}
              />
            }
          >
            <Text style={styles.placeholderText}>No bookmarks yet</Text>
          </ScrollView>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => String(i.id)}
            contentContainerStyle={{ padding: 12, flexGrow: 1 }}
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
                colors={['#7c3aed']}
              />
            }
            renderItem={({ item }) => {
              const posterUri = item.posterPath;
              return (
                <TouchableOpacity onPress={() => openDetails(item)} activeOpacity={0.9} style={styles.row}>
                  <Image source={{ uri: posterUri }} style={styles.thumb} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.itemTitle}>{item.title ?? item.name}</Text>
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>{(item.averageRating ?? 0).toFixed(1)}</Text>
                      </View>
                    </View>
                    <Text style={styles.itemMeta}>{(item.overview ?? '').slice(0, 80)}...</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeItem(item.movieId)} style={styles.removeBtn}>
                    <Bookmark color="#ffffff" fill="#ffffff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const mode = (layoutTheme.modes as any)[colorScheme] ?? layoutTheme.modes.dark;
  const cardBg = mode.card?.bg ?? (colorScheme === 'dark' ? '#11192A' : '#FFFFFF');
  const textPrimary = mode.text?.primary ?? (colorScheme === 'dark' ? '#FFFFFF' : '#192438');
  const borderColor = mode.card?.border ?? 'rgba(255,255,255,0.03)';

  return StyleSheet.create({
    blurCard: {
      borderRadius: 16,
      overflow: 'hidden',
      padding: 0,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
    },
    placeholderText: { color: textPrimary, marginBottom: 8 },
    title: { color: textPrimary, fontSize: 20, fontWeight: '800' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    clearBtn: { backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    clearText: { color: textPrimary, fontWeight: '700' },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: borderColor },
    thumb: { width: 72, height: 108, borderRadius: 8, backgroundColor: cardBg },
    itemTitle: { color: textPrimary, fontSize: 16, fontWeight: '700' },
    itemMeta: { color: textPrimary, marginTop: 6 },
    removeBtn: { padding: 10 },
    addButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    addButtonText: { color: '#fff', fontWeight: '700' },
    ratingBadge: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    ratingText: { color: '#FFD369', fontWeight: '800' },
  });
};
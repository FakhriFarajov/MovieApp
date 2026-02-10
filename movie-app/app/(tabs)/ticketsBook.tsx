import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { searchMovies } from '../api/movies.api';
import { useFetch } from '../api/useFetch';
import HeaderBar from '../components/header-bar';

const { width } = Dimensions.get('window');
const FULL_WIDTH = width;
const CAROUSEL_HEIGHT = Math.round(width * 0.56); // 16:9-ish

export default function BookTickets() {
  const router = useRouter();
  const scrollRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const { colorScheme } = useTheme();
  // derive quick theme values for non-style props
  const themeMode = layoutTheme.modes?.[(colorScheme as 'light' | 'dark')] ?? layoutTheme.modes.dark;
  const textColor = themeMode?.text?.primary ?? '#FFFFFF';
  const subText = themeMode?.text?.muted ?? 'rgba(255,255,255,0.6)';

  const styles = getStyles((colorScheme as 'light' | 'dark') ?? 'dark');
  const { data: movies, loading, error, refetch: refetchMovies } = useFetch<any[]>(async () => {
    const res = await searchMovies({ lang: '', page: 1, pageSize: 20, query: null, genreId: null });
    return res?.items ?? res?.results ?? [];
  });
  const items: any[] = Array.isArray(movies) ? movies : [];

  // autoplay
  const indexRef = useRef(0);
  useEffect(() => {
    if (!items || items.length === 0) return;
    const id = setInterval(() => {
      const next = (indexRef.current + 1) % items.length;
      indexRef.current = next;
      setActiveIndex(next);
      try { scrollRef.current?.scrollToOffset({ offset: next * FULL_WIDTH, animated: true }); } catch (e) { }
    }, 4000);
    return () => clearInterval(id);
  }, [items]);

  const renderCarouselItem = ({ item, index }: { item: any; index: number }) => {
    // Prefer backend-provided raw URLs (posterPath/backdropPath) and do not construct TMDB URLs
    const raw = (item as any).backdropPath ?? (item as any).posterPath ?? (item as any).backdrop_path ?? (item as any).poster_path ?? null;
    const uri = raw ? String(raw) : undefined;

    return (
      <TouchableOpacity onPress={() => router.push({ pathname: '/movie-details', params: { movie_id: String(item.id) } })} activeOpacity={0.9}>
        {uri ? (
          <Image source={{ uri }} style={{ width: FULL_WIDTH, height: CAROUSEL_HEIGHT, }} resizeMode="cover" />
        ) : (
          <View style={{ width: FULL_WIDTH, height: CAROUSEL_HEIGHT, alignItems: 'center', justifyContent: 'center', backgroundColor: '#222' }}>
            <Text style={{ color: '#fff' }}>No image</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGridItem = ({ item, index }: { item: any; index: number }) => {
    // Prefer backend-provided raw URLs (posterPath/backdropPath) and do not construct TMDB URLs
    const raw = (item as any).posterPath ?? (item as any).backdropPath ?? (item as any).poster_path ?? (item as any).backdrop_path ?? null;
    const uri = raw ? String(raw) : undefined;

    return (
      <View style={{ width: (width - 48) / 2, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.push({ pathname: '/movie-details', params: { movie_id: String(item.id) } })}>
          {uri ? (
            <Image source={{ uri }} style={styles.poster} />
          ) : (
            <View style={[styles.poster, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}
        </TouchableOpacity>
        <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]} style={styles.trendingGradient}>
          <Text numberOfLines={1} style={styles.trendingTitle}>{item.title ?? item.original_title ?? 'Unknown'}</Text>
        </LinearGradient>
      </View>
    );
  };

  // ensure active dot is visible when there are many items
  const totalDots = Math.max(0, items.length);
  const maxDots = Math.min(6, totalDots);
  let dotsStart = Math.max(0, activeIndex - Math.floor(maxDots / 2));
  if (dotsStart + maxDots > totalDots) dotsStart = Math.max(0, totalDots - maxDots);

  return (
    <LinearGradient colors={
      colorScheme === "dark"
        ? layoutTheme.colors.gradients.darkPrimary as any
        : layoutTheme.colors.gradients.lightPrimary as any
    }
      start={{ x: 0.9, y: 0.15 }}
      end={{ x: 0.1, y: 0.9 }}
      style={{ flex: 1, width: '100%' }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => { if (typeof refetchMovies === 'function') refetchMovies(); }}
              tintColor={textColor}
            />
          }
        >
          <HeaderBar onMenuPress={() => { }} onNotificationsPress={() => { }} />

          <View style={{ marginTop: 6 }}>
            {/* Carousel */}
            <View>
              {loading ? (
                <ActivityIndicator color={textColor} style={{ height: CAROUSEL_HEIGHT }} />
              ) : (
                <Animated.FlatList
                  ref={scrollRef}
                  data={items}
                  keyExtractor={(it: any, idx: number) => `${String(it.id)}-${idx}`}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                  )}
                  onMomentumScrollEnd={(ev) => {
                    const offsetX = ev.nativeEvent.contentOffset.x;
                    const idx = Math.round(offsetX / FULL_WIDTH);
                    indexRef.current = idx;
                    setActiveIndex(idx);
                  }}
                  renderItem={renderCarouselItem}
                />
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                {Array.from({ length: maxDots }).map((_, i) => {
                  const idx = dotsStart + i;
                  const it = items[idx];
                  const isActive = idx === activeIndex;
                  return (
                    <View
                      key={`${String((it && it.id) || idx)}-dot-${idx}`}
                      style={{
                        width: isActive ? 16 : 8,
                        height: 8,
                        borderRadius: 8,
                        backgroundColor: isActive ? textColor : 'rgba(255,255,255,0.3)',
                        marginHorizontal: 4,
                      }}
                    />
                  );
                })}
              </View>
            </View>

            {/* Grid */}
            <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
              <Text style={styles.heading}>Now Playing / Trending</Text>
              {loading ? (
                <ActivityIndicator color={textColor} />
              ) : (
                <FlatList
                  data={items}
                  keyExtractor={(it: any, idx: number) => `${String(it.id)}-${idx}`}
                  numColumns={2}
                  columnWrapperStyle={{ justifyContent: 'space-between' }}
                  scrollEnabled={false}
                  renderItem={renderGridItem}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// replace static styles with factory that accepts color scheme
const getStyles = (colorScheme: keyof typeof layoutTheme.modes) => {
  const themeMode = layoutTheme.modes?.[colorScheme] ?? layoutTheme.modes.dark;
  const textColor = themeMode?.text?.primary ?? '#FFFFFF';
  const subTextColor = themeMode?.text?.secondary ?? 'rgba(255,255,255,0.85)';

  return StyleSheet.create({
    poster: { width: '100%', aspectRatio: 0.67, borderRadius: 10, backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
    movieTitle: { color: textColor, fontSize: 14, fontWeight: '700', marginTop: 8 },
    trendingGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 8 },
    trendingTitle: { color: textColor, fontSize: 12, fontWeight: '700' },
    heading: { color: textColor, fontSize: 18, fontWeight: '700', marginBottom: 12 },
    noImageText: { color: textColor },
  });
};

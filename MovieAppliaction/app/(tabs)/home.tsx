import { layoutTheme } from '@/constant/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, Image, Platform, RefreshControl, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchGenres } from '../api/genres/genres.api';
import { getPopular, searchByNameOrGenre } from '../api/movies/movies.api';
import { useFetch } from '../api/useFetch';
import * as SecureStorage from 'expo-secure-store';
import { Movie } from '../entity-types/movieType';

import { useTheme } from '@/hooks/use-theme';
import { apiCallWithManualRefresh } from '@/shared/apiWithManualRefresh';
import HeaderBar from '../components/header-bar';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 170;
const CARD_HEIGHT = 300;
const ITEM_WIDTH = CARD_WIDTH + 16; // card + horizontal padding
const SPACER = Math.max(0, Math.floor((width - ITEM_WIDTH) / 2));

export default function Home() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const styles = getStyles(colorScheme as 'light' | 'dark');
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [slides, setSlides] = useState<Array<{ uri: string; title?: string; id?: string | number; description?: string }>>([]);
  const [allMovies, setAllMovies] = useState<any[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [slideLoaded, setSlideLoaded] = useState<(boolean | null)[]>([]);
  const flatRef = useRef<any>(null);
  const indexRef = useRef(0);
  const scrollX = useRef(new Animated.Value(0)).current;



  const { data: movies, loading: moviesLoading, error: moviesError, refetch: refetchMovies } = useFetch<any[]>(async () => {
    const res = await apiCallWithManualRefresh(() => getPopular({ lang: '', page: 1, pageSize: 20, genreId: null }));
    console.log('Fetched movies for slides:', res);
    console.log('Access token used for movies fetch:', SecureStorage.getItem('access_token'));
    return res?.items;
  });

  const { data: genres, loading: genresLoading, error: genresError, refetch: refetchGenres } = useFetch<any[]>(async () => {
    const res = await apiCallWithManualRefresh(() => fetchGenres());
    console.log('Fetched genres:', res);
    // normalize possible AxiosResponse or direct array into an array
    return (res?.data ?? res ?? []) as any[];
  });

  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined;
    const AUTOPLAY_INTERVAL = 3500;
    const id = setInterval(() => {
      const next = (indexRef.current + 1) % (slides.length || 1);
      indexRef.current = next;
      setActiveIndex(next);
      try {
        if (typeof flatRef.current?.scrollToIndex === 'function') {
          flatRef.current.scrollToIndex({ index: next, animated: true, viewPosition: 0.5 });
        } else {
          flatRef.current?.scrollToOffset({ offset: next * ITEM_WIDTH, animated: true });
        }
      } catch (e) {
      }
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(id);
  }, []);


  //Genres
  // After genres are fetched, request a broad list of movies (search endpoint) as a fallback
  useEffect(() => {
    let mounted = true;
    if (!genres) return;
    (async () => {
      try {
        // request first page with larger pageSize to populate UI
        const res = await apiCallWithManualRefresh(() => searchByNameOrGenre({ lang: '', page: 1, pageSize: 50, query: null, genreId: null }));
        if (!mounted) return;
        const items = res?.items ?? [];
        setAllMovies(items);
      } catch (e) {
        console.warn('failed to fetch all movies fallback', e);
      }
    })();
    return () => { mounted = false; };
  }, [genres]);

  // Build carousel slides from movies (or fallback to allMovies) and clear loading state
  useEffect(() => {
    const items = Array.isArray(movies) && movies.length ? movies : (Array.isArray(allMovies) ? allMovies : []);
    if (!items || items.length === 0) {
      setSlides([]);
      setLoadingSlides(false);
      return;
    }

    const s = items.slice(0, 12).map((m: any) => {
      const raw = m.posterPath;
      return {
        uri: raw ? String(raw) : '',
        title: m.title ?? m.name ?? m.original_title ?? 'Unknown',
        id: m.id,
        description: m.overview ?? m.description ?? '',
      };
    }).filter(sl => !!sl.uri);

    setSlides(s);
    setLoadingSlides(false);
  }, [movies, allMovies]);

  useEffect(() => {
    setSlideLoaded(s => {
      if (slides.length === s.length) return s;
      return slides.map(() => null);
    });
  }, [slides]);

  // Ensure carousel scrolls to the active index after slides are set (helps when returning from details)
  useEffect(() => {
    if (!flatRef.current || slides.length === 0) return;
    try {
      flatRef.current.scrollToIndex({ index: Math.min(activeIndex, Math.max(0, slides.length - 1)), animated: false, viewPosition: 0.5 });
    } catch (e) {
      // ignore; onScrollToIndexFailed handler will retry
    }
  }, [slides]);

  // Refresh function: re-fetch genres / trending / upcoming and rebuild slides
  const refreshHome = async () => {
    setLoadingSlides(true);
    try {
      // trigger refetch on all hooks so their data updates and UI lists refresh
      await Promise.all([
        typeof refetchGenres === 'function' ? refetchGenres() : Promise.resolve(),
        typeof refetchMovies === 'function' ? refetchMovies() : Promise.resolve(),
      ]);

      // movies state will update and the existing useEffect watching `movies` will rebuild slides
    } catch (e) {
      console.warn('refreshHome error', e);
    } finally {
      // small delay to avoid very quick spinner flicker when all requests finish instantly
      setTimeout(() => setLoadingSlides(false), 250);
    }
  };

  // Grid data for the 2-column movie list (fallback to allMovies when slides/movies are empty)
  const gridMovies: Movie[] = Array.isArray(movies) && movies.length ? movies as Movie[] : (Array.isArray(allMovies) ? allMovies as Movie[] : []);

  return (
    <LinearGradient
      colors={
        colorScheme === "dark"
          ? layoutTheme.colors.gradients.darkPrimary as any
          : layoutTheme.colors.gradients.lightPrimary as any
      }
      start={{ x: 0.9, y: 0.05 }}
      end={{ x: 0.9, y: 0.9 }}
      style={{ flex: 1, width: '100%' }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <FlatList
          data={gridMovies}
          keyExtractor={(item, i) => String(item?.id ?? i)}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: Platform.OS === 'ios' ? 140 : 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loadingSlides}
              onRefresh={refreshHome}
              tintColor={(styles.activityColor as any).color}
            />
          }
          ListHeaderComponent={
            <>
              <HeaderBar />

              {/* Movies list carousel*/}
              <View style={{ alignItems: 'center' }}>
                <Animated.FlatList
                  nestedScrollEnabled={true}
                  ref={flatRef}
                  initialScrollIndex={activeIndex}
                  getItemLayout={(_, index) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index })}
                  data={slides}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={ITEM_WIDTH}
                  decelerationRate="fast"
                  contentContainerStyle={{ alignItems: 'center', paddingHorizontal: SPACER }}
                  keyExtractor={(_, i) => String(i)}
                  onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                      try { flatRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 }); } catch (e) { }
                    }, 120);
                  }}
                  onMomentumScrollEnd={(ev) => {
                    const offsetX = ev.nativeEvent.contentOffset.x;
                    const page = Math.round(offsetX / ITEM_WIDTH);
                    const clamped = Math.max(0, Math.min(slides.length - 1, page));
                    indexRef.current = clamped;
                    setActiveIndex(clamped);
                  }}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                  )}
                  scrollEventThrottle={16}
                  renderItem={({ item: src, index: i }) => {
                    const inputRange = [(i - 1) * ITEM_WIDTH, i * ITEM_WIDTH, (i + 1) * ITEM_WIDTH];
                    const scale = scrollX.interpolate({ inputRange, outputRange: [0.92, 1, 0.92], extrapolate: 'clamp' });
                    const opacity = scrollX.interpolate({ inputRange, outputRange: [0.6, 1, 0.6], extrapolate: 'clamp' });
                    return (
                      <View style={{ width: ITEM_WIDTH, padding: 8, alignItems: 'center', justifyContent: 'center' }}>
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => {
                            router.push({
                              pathname: '/movie-details',
                              params: { movie_id: String(src.id) }
                            });
                          }}
                          hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
                          style={{
                            width: ITEM_WIDTH,
                            padding: 8,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Animated.View style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT, transform: [{ scale }], opacity }]}>
                            {slideLoaded[i] === false ? (
                              <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,0,0,0.08)' }}>
                                <Text style={{ color: '#fff' }}>Image failed</Text>
                              </View>
                            ) : (
                              <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
                                <Image
                                  source={{ uri: src.uri }}
                                  style={{ width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 12 }}
                                  resizeMode="cover"
                                  onLoad={() => setSlideLoaded(s => { const c = [...s]; c[i] = true; return c; })}
                                  onError={() => setSlideLoaded(s => { const c = [...s]; c[i] = false; return c; })}
                                />
                                <LinearGradient
                                  colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.65)", "rgba(0,0,0,0.96)"]}
                                  locations={[0, 0.45, 1]}
                                  style={[styles.cardGradient, { height: CARD_HEIGHT * 0.55, justifyContent: 'flex-end', paddingBottom: 16 }]}
                                >
                                  <Text numberOfLines={1} style={styles.cardTitle}>{src.title ?? 'Unknown'}</Text>
                                  <Text numberOfLines={2} style={styles.cardDesc}>{src.description ?? `Photo ${src.id ?? ''}`}</Text>
                                </LinearGradient>
                              </View>
                            )}
                          </Animated.View>
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                />
                <View style={styles.dotsContainer}>
                  {slides.map((_, i) => (
                    <View key={i} style={[styles.dot, activeIndex === i && styles.dotActive]} />
                  ))}
                </View>
              </View>

              {/* genres */}
              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: '8%' }}>
                  <Text style={styles.sectionTitle}>Genres</Text>
                  <TouchableOpacity onPress={() => router.push({ pathname: '/genres' })}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ width: '100%', paddingVertical: 12 }}>
                  <FlatList
                    horizontal
                    data={Array.isArray(genres) ? genres : (genres ?? [])}
                    keyExtractor={(g) => String((g as any).id)}
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    contentContainerStyle={{ paddingHorizontal: 14 }}
                    renderItem={({ item: genre }) => {
                      const isActive = activeGenre === String(genre.id);
                      return (
                        <TouchableOpacity onPress={() => {
                          setActiveGenre(String(genre.id));
                          router.push({ pathname: '/search-results', params: { genreIds: String(genre.id) } });
                        }} activeOpacity={0.85} style={{ marginRight: 8 }}>
                          {isActive ? (
                            <LinearGradient
                              colors={["#7C3AED", "#FB7185"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={[styles.tab, styles.tabActiveGradient]}
                            >
                              <Text style={[styles.tabText, styles.tabTextActive]}>{genre.name}</Text>
                            </LinearGradient>
                          ) : (
                            <View style={styles.tab}>
                              <Text style={styles.tabText}>{genre.name}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              </View>

              {/* Latest movies: larger thumbnails with 'New' badge */}
              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: '8%' }}>
                  <Text style={styles.sectionTitle}>Latest Movies</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ width: '100%', paddingVertical: 12 }}>
                  {loadingSlides ? (
                    <ActivityIndicator size="small" color={styles.activityColor.color} style={{ marginVertical: 8 }} />
                  ) : (
                    <FlatList
                      horizontal
                      data={movies}
                      keyExtractor={(_, i) => `latest-${i}`}
                      showsHorizontalScrollIndicator={false}
                      nestedScrollEnabled
                      contentContainerStyle={{ paddingHorizontal: 14 }}
                      renderItem={({ item: it, index: i }) => {
                        return (
                          <TouchableOpacity key={`latest-${i}`} activeOpacity={0.9} onPress={() => {
                            setActiveIndex(i); indexRef.current = i; try { if (typeof flatRef.current?.scrollToIndex === 'function') { flatRef.current.scrollToIndex({ index: i, animated: true, viewPosition: 0.5 }); } else { flatRef.current?.scrollToOffset({ offset: i * ITEM_WIDTH, animated: true }); } } catch (e) { } finally {
                              router.push({
                                pathname: '/movie-details',
                                params: { movie_id: String(it.id) }
                              });
                            }
                          }} style={{ marginRight: 12 }}>
                            <View style={styles.latestItem}>
                              {(() => {
                                const raw = (it as any).posterPath ?? (it as any).backdropPath ?? (it as any).poster_path ?? (it as any).backdrop_path ?? null;
                                const url = raw ? String(raw) : undefined;
                                return <Image source={{ uri: url }} style={styles.latestThumb} />;
                              })()}
                              <View style={styles.latestBadge}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>NEW</Text></View>
                              <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]} style={styles.latestGradient}>
                                <Text numberOfLines={1} style={styles.latestTitle}>{it.title ?? 'Unknown'}</Text>
                              </LinearGradient>
                            </View>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  )}
                </View>
              </View>

              {/* All Movies header */}
              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: '8%', marginBottom: 12 }}>
                  <Text style={styles.sectionTitle}>All Movies</Text>
                  <TouchableOpacity onPress={() => router.push({ pathname: '/search-results' })}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          }
          renderItem={({ item }: { item: Movie }) => {
            const raw = item.posterPath ?? item.backdropPath ?? (item as any).poster_path ?? (item as any).backdrop_path ?? null;
            const poster = raw ? String(raw) : undefined;
            const title = item.title ?? 'Untitled';
            const ratingNum = Number((item as any).averageRating);

            return (
              <View style={{ width: '48%' }}>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/movie-details', params: { movie_id: String(item.id) } })}
                >
                  {poster ? (
                    <Image source={{ uri: poster }} style={styles.posterSmall} />
                  ) : (
                    <View style={[styles.posterSmall, { alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ color: '#fff' }}>No Image</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={{ marginTop: 7 }}>
                  <Text numberOfLines={1} style={styles.latestTitle}>{title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Star size={14} fill="#FFD369" color={"transparent"} />
                    <Text style={[styles.cardDesc, { marginLeft: 6 }]}>{ratingNum.toFixed(1)}</Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={!loadingSlides ? <Text style={[styles.placeholderText, { paddingHorizontal: 16 }]}>No movies</Text> : <ActivityIndicator color={styles.activityColor.color} />}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}


const getStyles = (colorScheme: 'light' | 'dark') => {
  const mode = (layoutTheme.modes as any)[colorScheme] ?? layoutTheme.modes.dark;
  const primary = mode.text?.primary ?? '#fff';
  const secondary = mode.text?.primary ?? 'rgba(255,255,255,0.8)';

  return StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: 'rgba(0,0,0,0.15)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
      elevation: 6,
    },
    cardImage: { width: '100%', height: '100%' },
    cardGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
    cardTitle: { color: primary, fontSize: 16, fontWeight: '700' },
    cardDesc: { color: secondary, fontSize: 12, marginTop: 6 },
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12 },
    dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 6 },
    dotActive: { backgroundColor: primary, width: 16, height: 8, borderRadius: 8 },
    tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', marginRight: 8 },
    tabActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
    tabText: { color: secondary, fontSize: 13 },
    tabTextActive: { color: primary, fontWeight: '700' },
    tabActiveGradient: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
    trendingItem: { width: 120, height: 160, borderRadius: 10, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' },
    trendingActive: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)' },
    trendingThumb: { width: '100%', height: '100%' },
    trendingGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 8 },
    trendingTitle: { color: primary, fontSize: 12, fontWeight: '700' },
    latestItem: { width: 220, height: 140, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)' },
    latestThumb: { width: '100%', height: '100%' },
    latestBadge: { position: 'absolute', left: 8, top: 8, backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    latestGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10 },
    latestTitle: { color: primary, fontSize: 14, fontWeight: '700' },
    sectionTitle: { color: primary, fontSize: 16, fontWeight: '700' },
    seeAllText: { color: secondary, fontSize: 14 },
    placeholderText: { color: primary },
    activityColor: { color: primary },
    container: { paddingHorizontal: 12 },
    trendingThumbGrid: { width: '100%', height: 280, borderRadius: 12, overflow: 'hidden' },
    posterSmall: { width: '100%', aspectRatio: 0.7, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)' },
  });
};
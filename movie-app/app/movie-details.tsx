import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark, ChevronLeft, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { addBookmark, deleteBookmark, fetchBookmarks } from './api/bookmarks.api';

import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchGenres } from './api/genres.api';
import { fetchMovieById, fetchMovieVideos } from './api/movies.api';
import { useFetch } from './api/useFetch';
import { Movie } from './types/movieType';
import { VideoResponse } from './types/videos';

const { width } = Dimensions.get('window');
const POSTER_W = Math.min(160, Math.floor(width * 0.30));

export default function MovieDetailsScreen() {
    const router = useRouter();
    const { movie_id } = useLocalSearchParams<{ movie_id: string }>();
    const { colorScheme } = useTheme();

    const [playing, setPlaying] = useState(false);
    const [booked, setBooked] = useState(false);
    const [bookmarkId, setBookmarkId] = useState<string | null>(null);

    if (!movie_id || typeof movie_id !== 'string' || movie_id.trim() === '') {
        return (
            <View style={styles.center}>
                <Text style={{ color: '#fff' }}>Invalid movie ID</Text>
            </View>
        );
    }

    const idStr = movie_id as string;

    const {
        data: movie,
        loading,
        error,
        refetch: refetchMovie,
    } = useFetch<Movie | { items: Movie[] }>(() => fetchMovieById(idStr));

    const [isRefreshing, setIsRefreshing] = useState(false);
    const {
        data: videos,
        loading: videosLoading,
        error: videosError,
        refetch: refetchVideos,
    } = useFetch<VideoResponse>(() => fetchMovieVideos(idStr as any));

    const { data: genresData } = useFetch<any>(() => fetchGenres());
    const genresList = Array.isArray(genresData) ? genresData : (genresData?.genres ?? []);
    const genreMap = (genresList || []).reduce((acc: Record<string, string>, g: any) => { if (g?.id !== undefined) acc[String(g.id)] = g.name ?? g.title ?? String(g.id); return acc; }, {} as Record<string, string>);

    const refresh = async () => {
        try {
            setIsRefreshing(true);
            await Promise.all([
                typeof refetchMovie === 'function' ? refetchMovie() : Promise.resolve(),
                typeof refetchVideos === 'function' ? refetchVideos() : Promise.resolve(),
            ]);
        } catch (e) {
            console.warn('refresh error', e);
        } finally {
            setIsRefreshing(false);
        }
    };

    const officialVideo = videos?.results
        ?.filter((v: any) => v?.official && v?.site === 'YouTube' && v?.type === 'Trailer')
        ?.sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())[0];

    const onStateChange = (state: string) => {
        if (state === 'ended') setPlaying(false);
    };

    // Toggle bookmark with optimistic UI and API call (uses idStr so it can be used before movieData is loaded)
    const toggleBookmark = async () => {
        const idForMovie = String(idStr);
        if (!idForMovie) return;

        if (booked) {
            setBooked(false);
            try {
                let idToDelete: string | null = bookmarkId ?? null;
                if (!idToDelete) {
                    // try to find bookmark by movie id
                    try {
                        const list: any[] = await fetchBookmarks();
                        const found = (list || []).find((b: any) => String(b.movieId ?? b.movie_id ?? b.movie?.id ?? '') === idForMovie || String(b.movieId ?? b.movie_id ?? '') === idForMovie);
                        idToDelete = found?.id ?? found?.bookmarkId ?? found?.bookmark_id ?? null;
                    } catch (e) {
                        console.warn('Failed to fetch bookmarks to resolve id', e);
                    }
                }
                console.log('Deleting bookmark, id:', idToDelete);
                if (idToDelete) {
                    await deleteBookmark(undefined, String(idToDelete));
                    console.log('deleteBookmark succeeded for id:', idToDelete);
                    setBookmarkId(null);
                } else {
                    console.warn('No bookmark id found to delete for movie', idForMovie);
                }
            } catch (e) {
                console.warn('Failed to remove bookmark error:', e);
                console.warn('Failed to remove bookmark', e);
                setBooked(true);
            }
        } else {
            setBooked(true);
            try {
                console.log('Adding bookmark for movieId:', idForMovie);
                const res: any = await addBookmark(idForMovie);
                console.log('addBookmark response:', res);
                const createdId = res?.id ?? res?.bookmarkId ?? res?.bookmark_id ?? null;
                if (createdId) setBookmarkId(String(createdId));
            } catch (e) {
                console.warn('Failed to add bookmark error:', e);
                console.warn('Failed to add bookmark', e);
                setBooked(false);
            }
        }
    };

    // placeholder to avoid using movieData before declaration; real logic added after movieData is available
    useEffect(() => {}, []);

    const movieData = (movie && (Array.isArray((movie as any).items) ? (movie as any).items[0] : movie)) as Movie;
    if (!movieData) {
        return (
            <View style={styles.center}>
                <Text style={{ color: '#fff' }}>Movie not found</Text>
            </View>
        );
    }
    // alias to `any` so we can safely read legacy/snake_case fields without TypeScript errors
    const md: any = movieData as any;
    const posterUrl = md.posterPath ?? md.poster_path ?? md.poster ?? undefined;
    const backdropUrl = md.backdropPath ?? md.backdrop_path ?? md.backdrop ?? undefined;
    // prefer averageRating from backend if present
    const ratingNum = Number(md.averageRating ?? md.vote_average ?? md.voteAverage ?? 0);
    const ageLabel = md.ageRestriction ?? (md.isForAdult ? '18+' : (md.adult ? '18+' : undefined));
    const taglineText = md.tagLine ?? md.tagline ?? null;
    const homepageUrl = md.homePageUrl ?? md.homepage ?? md.homepageUrl ?? null;
    const budgetVal = md.budget ?? md.budget_usd ?? null;
    const revenueVal = md.revenue ?? md.revenue_usd ?? null;
    const statusVal = md.status ?? null;
    const actorsArray: string[] | undefined = Array.isArray(md.actors) ? md.actors : (typeof md.actors === 'string' ? md.actors.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined);
    const runtimeMin = md.runtime ?? (md.duration ? (() => { const parts = String(md.duration).split(':').map(Number); return parts.length >= 2 ? parts[0] * 60 + (parts[1] || 0) : undefined; })() : undefined);
    const releaseDateStr = md.releaseDate ?? md.release_date ?? undefined;
    const formattedReleaseDate = releaseDateStr ? String(releaseDateStr).split('T')[0].replace(/-/g, '/') : undefined;
    // robust YouTube id extraction using URL parsing (handles youtu.be and full youtube URLs)
    let backendYoutubeId: string | null = null;
    try {
      if (md.videoUrl) {
        const u = new URL(String(md.videoUrl));
        if (u.hostname.includes('youtu.be')) {
          backendYoutubeId = (u.pathname || '').split('/').filter(Boolean).pop() || null;
        } else {
          backendYoutubeId = u.searchParams.get('v');
        }
      }
    } catch (e) {
      // fallback: try quick regex
      const m = String(md.videoUrl ?? '').match(/([A-Za-z0-9_-]{11})/);
      backendYoutubeId = m ? m[1] : null;
    }
    const chosenVideoId = officialVideo?.key ?? backendYoutubeId ?? null;
    // app accent (purple)
    const accent = (layoutTheme.colors as any).accent?.[500] ?? '#7C3AED';
    // explicit button color (ensure #7CAED) and star color (yellow)
    const buttonColor = '#7C3AED';
    const starColor = '#FBBF24';


    return (
        <LinearGradient
            colors={
                colorScheme === "dark"
                    ? layoutTheme.colors.gradients.darkPrimary as any
                    : layoutTheme.colors.gradients.lightPrimary as any
            }
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScrollView
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={accent} />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* BACKDROP - Wider and cleaner */}
                    <View>
                        {backdropUrl ? (
                            <Image source={{ uri: backdropUrl }} style={styles.backdrop} />
                        ) : (
                            <View style={[styles.backdrop, { backgroundColor: '#121212' }]} />
                        )}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.6)', '#000']}
                            style={styles.backdropGradient}
                        />
                    </View>

                    {/* TOP CONTROLS - Floating over backdrop */}
                    <View style={styles.topControls}>
                        <TouchableOpacity onPress={router.back} style={styles.topBtn}>
                            <ChevronLeft color="#fff" size={28} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleBookmark} style={styles.topBtn}>
                            <Bookmark color="#fff" fill={booked ? '#fff' : 'none'} size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* CONTENT START */}
                    <View style={styles.content}>
                        <View style={styles.headerRow}>
                            {posterUrl ? (
                                <Image source={{ uri: posterUrl }} style={styles.poster} />
                            ) : (
                                <View style={[styles.poster, styles.posterPlaceholder]} />
                            )}

                            <View style={styles.mainInfo}>
                                <Text style={styles.title}>{movieData?.title ?? '—'}</Text>

                                {/* METADATA ROW - Full Release Date | Duration | Age */}
                                <View style={styles.metaDataRow}>
                                    <Text style={styles.metaText}>{formattedReleaseDate ?? '—'}</Text>
                                    <View style={styles.dot} />
                                    <Text style={styles.metaText}>{runtimeMin ? `${runtimeMin}m` : '—'}</Text>
                                    {ageLabel && (
                                        <>
                                            <View style={styles.dot} />
                                            <View style={styles.ageBadge}>
                                                <Text style={styles.ageBadgeText}>{ageLabel}</Text>
                                            </View>
                                        </>
                                    )}
                                </View>

                                {!!taglineText && (
                                    <Text style={[styles.tagline, { fontStyle: 'italic', color: '#fff' }]} numberOfLines={2}>
                                        {`"${taglineText}"`}
                                    </Text>
                                )}

                                <View style={styles.ratingRow}>
                                    <Star size={16} fill={starColor} color={starColor} />
                                    <Text style={styles.ratingText}>{ratingNum.toFixed(1)}</Text>
                                </View>
                            </View>
                        </View>

                        {/* DETAILS LIST - Moved here so it's shown right after the image/header */}
                        <View style={styles.detailsList}>
                            <Text style={styles.sectionTitle}>Information</Text>
                            <DetailRow label="Director" value={movieData?.director} />
                            <DetailRow label="Cast" value={actorsArray?.join(', ')} />
                            <DetailRow label="Release Date" value={formattedReleaseDate} />
                            <DetailRow label="Duration" value={md.duration ?? (runtimeMin ? `${runtimeMin}m` : undefined)} />
                            <DetailRow label="Language" value={movieData?.originalLanguage?.toUpperCase()} />
                            <DetailRow label="Age" value={md.ageRestriction ?? (md.isForAdult || md.adult ? '18+' : undefined)} />
                            <DetailRow label="Status" value={statusVal} />
                            <DetailRow label="Budget" value={budgetVal !== null && budgetVal !== undefined ? (typeof budgetVal === 'number' ? budgetVal.toLocaleString() : String(budgetVal)) : undefined} />
                            <DetailRow label="Revenue" value={revenueVal !== null && revenueVal !== undefined ? (typeof revenueVal === 'number' ? revenueVal.toLocaleString() : String(revenueVal)) : undefined} />
                            {homepageUrl && (
                                <View style={{ marginTop: 8 }}>
                                    <TouchableOpacity
                                        onPress={() => { try { Linking.openURL(String(homepageUrl)); } catch (e) {} }}
                                        style={[styles.visitButton, { backgroundColor: buttonColor }]}
                                    >
                                        <Text style={styles.visitButtonText}>Visit Homepage</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* PRIMARY ACTION */}
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/schedule', params: { movie_id: idStr } })}
                            style={[styles.mainActionBtn, { backgroundColor: buttonColor }]}
                        >
                            <Text style={styles.mainActionText}>Get Tickets</Text>
                        </TouchableOpacity>

                        {/* OVERVIEW */}
                        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 2 }]}>Overview</Text>
                        <Text style={styles.overview}>{movieData?.overview ?? 'No description available.'}</Text>

                        {/* GENRES - Horizontal Scroll */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
                            {(md.genres ?? []).map((g: any) => (
                                <View key={g?.id ?? String(g)} style={styles.genreChip}>
                                    <Text style={styles.genreChipText}>{g?.name ?? g?.title ?? String(g)}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        {/* TRAILER */}
                        {chosenVideoId ? (
                            <View style={styles.videoSection}>
                                <Text style={styles.sectionTitle}>Trailer</Text>
                                <View style={styles.videoContainer}>
                                    <YoutubePlayer height={210} play={playing} videoId={chosenVideoId} onChangeState={onStateChange} />
                                </View>
                            </View>
                        ) : md.videoUrl ? (
                            <View style={styles.videoSection}>
                                <Text style={styles.sectionTitle}>Trailer</Text>
                                <TouchableOpacity onPress={() => { try { Linking.openURL(String(md.videoUrl)); } catch (e) {} }} style={[styles.watchButton, { borderColor: buttonColor }] }>
                                    <Text style={[styles.watchButtonText, { color: buttonColor }]}>Watch Trailer</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}

                        <View style={{ height: 60 }} />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

// Helper component for cleaner code
const DetailRow = ({ label, value }: { label: string, value?: string }) => {
    if (!value) return null;
    return (
        <View style={styles.infoLine}>
            <Text style={styles.infoLabel}>{label}: </Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backdrop: { width: '100%', height: width * 0.85 },
    backdropGradient: { position: 'absolute', bottom: 0, height: '60%', width: '100%' },
    topControls: { position: 'absolute', top: 20, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
    topBtn: { padding: 8, borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.5)' },

    content: { paddingHorizontal: 16, marginTop: -80 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
    poster: {
        width: POSTER_W,
        height: POSTER_W * 1.5,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    posterPlaceholder: { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
    mainInfo: { flex: 1, marginLeft: 16, paddingTop: 60 },
    title: { color: '#fff', fontSize: 26, fontWeight: 'bold', lineHeight: 30 },

    metaDataRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
    metaText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#a3a3a3', marginHorizontal: 8 },

    tagline: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    ratingText: { color: '#fff', marginLeft: 6, fontWeight: 'bold', fontSize: 15 },

    ageBadge: { borderWidth: 1, borderColor: '#a3a3a3', paddingHorizontal: 4, borderRadius: 2 },
    ageBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    mainActionBtn: { paddingVertical: 14, borderRadius: 4, alignItems: 'center', marginTop: 25 },
    mainActionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    watchButton: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
    watchButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },

    overview: { color: '#fff', fontSize: 15, lineHeight: 22, marginTop: 20 },

    genreScroll: { marginTop: 20 },
    genreChip: { marginRight: 8, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#262626' },
    genreChipText: { color: '#fff', fontSize: 12, fontWeight: '500' },

    videoSection: { marginTop: 30 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    videoContainer: { borderRadius: 8, overflow: 'hidden' },

    detailsList: { marginTop: 30, paddingTop: 20 },
    infoLine: { flexDirection: 'row', marginBottom: 10, justifyContent: 'space-between', alignItems: 'center' },
    infoLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
    infoValue: { color: '#fff', fontSize: 14, flex: 1, fontWeight: '400', textAlign: 'right' },
    visitButton: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 6, alignItems: 'center', alignSelf: 'flex-start', width: '100%' },
    visitButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
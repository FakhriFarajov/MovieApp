import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark, ChevronLeft, Star } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { addBookmark, deleteBookmark } from './api/bookmarks/bookmarks.api';
import { getDetails } from './api/movies/movies.api';

import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiCallWithManualRefresh } from '@/shared/apiWithManualRefresh';
import { fetchGenres } from './api/genres/genres.api';
import { Movie } from './entity-types/movieType';

const { width } = Dimensions.get('window');
const POSTER_W = Math.min(160, Math.floor(width * 0.30));

export default function MovieDetailsScreen() {
    const router = useRouter();
    const { movie_id } = useLocalSearchParams<{ movie_id: string }>();
    const { colorScheme } = useTheme();

    const [playing, setPlaying] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isInBookmark, setIsInBookmark] = useState(false);
    const [movieDetails, setMovieDetails] = useState<any | null>(null);
    const [genresData, setGenresData] = useState<any[]>([]);

    const refetchMovie = async () => {
        try {
            const res: any = await apiCallWithManualRefresh(() => getDetails(movie_id!));
            if (res) {
                setMovieDetails(res);
                console.log('Movie details fetched:', res);
                setIsInBookmark(!!res.isInBookmark);
            }
        } catch (e) {
            console.error('refetchMovie error', e);
        }
    };

    const refetchGenres = async () => {
        try {
            const res: any = await apiCallWithManualRefresh(() => fetchGenres());
            const arr = Array.isArray(res) ? res : (res?.genres ?? []);
            setGenresData(arr);
        } catch (e) {
            console.error(e);
        }
    };

    React.useEffect(() => {
        if (movie_id) {
            refetchMovie();
            refetchGenres();
        }
    }, [movie_id]);

    // --- DERIVED DATA ---
    const movieGenres = useMemo(() => {
        if (!movieDetails?.genreIds || !genresData.length) return [];
        return genresData.filter(g => movieDetails.genreIds.includes(g.id));
    }, [movieDetails, genresData]);

    const formattedDuration = useMemo(() => {
        if (!movieDetails?.duration) return '—';
        // Handles "01:03:00" -> 63m
        if (typeof movieDetails.duration === 'string' && movieDetails.duration.includes(':')) {
            const parts = movieDetails.duration.split(':').map(Number);
            if (parts.length === 3) {
                const totalMinutes = (parts[0] * 60) + parts[1];
                return `${totalMinutes}m`;
            }
        }
        return `${movieDetails.duration}m`;
    }, [movieDetails]);

    const formattedReleaseDate = movieDetails?.releaseDate 
        ? movieDetails.releaseDate.split('T')[0].replace(/-/g, '/') 
        : '—';

    const videoId = useMemo(() => {
        if (!movieDetails?.videoUrl) return null;
        // Updated regex to handle the "si=" parameter in your URL
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = movieDetails.videoUrl.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }, [movieDetails?.videoUrl]);

    // --- ACTIONS ---
    const toggleBookmark = async () => {
        const wasBookmarked = isInBookmark;
        
        // 1. Optimistic Update: Change the UI immediately
        setIsInBookmark(!wasBookmarked);

        try {
            if (wasBookmarked) {
                // If it was true, we call delete
                await deleteBookmark(movie_id!);
                console.log('Removed from bookmarks');
            } else {
                // If it was false, we call add
                await addBookmark(movie_id!);
                console.log('Added to bookmarks');
            }
        } catch (e) {
            // 2. Revert: If the API fails, put it back to what it was
            console.warn('Bookmark action failed, reverting state', e);
            setIsInBookmark(wasBookmarked);
        }
    };

    const refresh = async () => {
        setIsRefreshing(true);
        await Promise.all([refetchMovie(), refetchGenres()]);
        setIsRefreshing(false);
    };

    if (!movieDetails) return null;

    const accent = (layoutTheme.colors as any).accent?.[500] ?? '#7C3AED';
    const gradientColors = (colorScheme === "dark"
        ? (layoutTheme.colors as any).gradients.darkPrimary
        : (layoutTheme.colors as any).gradients.lightPrimary) as unknown as [string, string, ...string[]];

    return (
        <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScrollView
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor="#fff" />}
                    showsVerticalScrollIndicator={false}
                >
                    <View>
                        <Image source={{ uri: movieDetails.backdropPath }} style={styles.backdrop} />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)', '#000']} style={styles.backdropGradient} />
                    </View>

                    <View style={styles.topControls}>
                        <TouchableOpacity onPress={router.back} style={styles.topBtn}>
                            <ChevronLeft color="#fff" size={28} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleBookmark} style={styles.topBtn}>
                            {/* The 'fill' logic here handles the white flag vs outline */}
                            <Bookmark 
                                color="#fff" 
                                fill={isInBookmark ? '#fff' : 'transparent'} 
                                size={24} 
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.headerRow}>
                            <Image source={{ uri: movieDetails.posterPath }} style={styles.poster} />
                            <View style={styles.mainInfo}>
                                <Text style={styles.title}>{movieDetails.title}</Text>
                                <View style={styles.metaDataRow}>
                                    <Text style={styles.metaText}>{formattedReleaseDate}</Text>
                                    <View style={styles.dot} />
                                    <Text style={styles.metaText}>{formattedDuration}</Text>
                                    <View style={styles.dot} />
                                    <View style={styles.ageBadge}>
                                        <Text style={styles.ageBadgeText}>{movieDetails.ageRestriction}+</Text>
                                    </View>
                                </View>
                                {movieDetails.tagLine && <Text style={styles.tagline}>"{movieDetails.tagLine}"</Text>}
                                <View style={styles.ratingRow}>
                                    <Star size={16} fill="#FBBF24" color="#FBBF24" />
                                    <Text style={styles.ratingText}>{movieDetails.averageRating?.toFixed(1)}</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/schedule', params: { movie_id } })}
                            style={[styles.mainActionBtn, { backgroundColor: accent }]}
                        >
                            <Text style={styles.mainActionText}>Get Tickets</Text>
                        </TouchableOpacity>

                        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Overview</Text>
                        <Text style={styles.overview}>{movieDetails.overview}</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
                            {movieGenres.map((g) => (
                                <View key={g.id} style={styles.genreChip}>
                                    <Text style={styles.genreChipText}>{g.name}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.detailsList}>
                            <Text style={styles.sectionTitle}>Information</Text>
                            <DetailRow label="Director" value={movieDetails.director} />
                            <DetailRow label="Cast" value={movieDetails.actors?.join(', ')} />
                            <DetailRow label="Status" value={movieDetails.status} />
                            <DetailRow label="Budget" value={movieDetails.budget ? `$${movieDetails.budget.toLocaleString()}` : undefined} />
                        </View>

                        {videoId && (
                            <View style={styles.videoSection}>
                                <Text style={styles.sectionTitle}>Trailer</Text>
                                <View style={styles.videoContainer}>
                                    <YoutubePlayer height={210} play={playing} videoId={videoId} />
                                </View>
                            </View>
                        )}
                        <View style={{ height: 40 }} />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const DetailRow = ({ label, value }: { label: string, value?: string }) => {
    if (!value) return null;
    return (
        <View style={styles.infoLine}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: { width: '100%', height: width * 0.85 },
    backdropGradient: { position: 'absolute', bottom: 0, height: '60%', width: '100%' },
    topControls: { position: 'absolute', top: 20, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
    topBtn: { padding: 8, borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.5)' },
    content: { paddingHorizontal: 16, marginTop: -80 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
    poster: { width: POSTER_W, height: POSTER_W * 1.5, borderRadius: 8 },
    mainInfo: { flex: 1, marginLeft: 16, paddingTop: 60 },
    title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    metaDataRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    metaText: { color: '#fff', fontSize: 13 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#a3a3a3', marginHorizontal: 8 },
    tagline: { color: '#ddd', fontSize: 13, fontStyle: 'italic', marginTop: 8 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    ratingText: { color: '#fff', marginLeft: 6, fontWeight: 'bold' },
    ageBadge: { borderWidth: 1, borderColor: '#fff', paddingHorizontal: 4, borderRadius: 4 },
    ageBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    mainActionBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 25 },
    mainActionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    overview: { color: '#ddd', fontSize: 15, lineHeight: 22 },
    genreScroll: { marginTop: 20 },
    genreChip: { marginRight: 8, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
    genreChipText: { color: '#fff', fontSize: 12 },
    videoSection: { marginTop: 30 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    videoContainer: { borderRadius: 12, overflow: 'hidden' },
    detailsList: { marginTop: 30 },
    infoLine: { flexDirection: 'row', marginBottom: 12, justifyContent: 'space-between' },
    infoLabel: { color: '#aaa', fontSize: 14 },
    infoValue: { color: '#fff', fontSize: 14, flex: 1, textAlign: 'right', marginLeft: 20 }
});
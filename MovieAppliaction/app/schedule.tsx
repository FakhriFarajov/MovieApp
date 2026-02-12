import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState, useEffect } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArrowLeft } from 'lucide-react-native';
import { getDetails as fetchMovieById } from './api/movies/movies.api';
import { fetchShowTimesByMovie } from './api/showtimes/showtimes.api';
import { ShowTime } from './api/showtimes/showtimes.types';
import { fetchTheatres } from './api/theatres/theatres.api';
import { apiCallWithManualRefresh } from '@/shared/apiWithManualRefresh';

const { width } = Dimensions.get('window');
const POSTER_W = Math.min(140, Math.floor(width * 0.26));

export default function ScheduleScreen() {
    const { colorScheme } = useTheme();
    const router = useRouter();
    const { movie_id } = useLocalSearchParams<{ movie_id: string }>();
    const parsedMovieId = Number(movie_id);

    const [movie, setMovie] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<any>(null);
    const [showTimes, setShowTimes] = useState<ShowTime[]>([]);
    const [theatres, setTheatres] = useState<any[]>([]);

    useEffect(() => {
        let mounted = true;
        if (!movie_id) {
            setMovie(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        (async () => {
            try {
                // Fetch movie details, showtimes, and theatres in parallel
                const [movieRes, showTimesRes, theatresRes] = await Promise.all([
                    apiCallWithManualRefresh(() => fetchMovieById(String(movie_id))),
                    apiCallWithManualRefresh(() => fetchShowTimesByMovie(String(movie_id))),
                    apiCallWithManualRefresh(() => fetchTheatres()),
                ]);
                
                if (!mounted) return;
                
                // API may return an axios response wrapper or the raw movie object
                const m = (movieRes as any)?.data ?? movieRes ?? null;
                setMovie(m);
                setShowTimes(Array.isArray(showTimesRes) ? showTimesRes : []);
                setTheatres(Array.isArray(theatresRes) ? theatresRes : []);
                setFetchError(null);
            } catch (e) {
                if (!mounted) return;
                setFetchError(e);
                setMovie(null);
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [movie_id]);

    // Build dates from actual showtimes data, or fallback to next 7 days if no showtimes
    const dates = useMemo(() => {
        const out: { label: string; iso: string; weekday: string }[] = [];
        
        if (showTimes.length > 0) {
            // Get unique dates from showtimes
            const uniqueDates = [...new Set(showTimes.map((st) => {
                const d = new Date(st.startTime);
                return d.toISOString().split('T')[0];
            }))].sort();
            
            for (const iso of uniqueDates) {
                const d = new Date(iso + 'T12:00:00'); // Add time to avoid timezone issues
                const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
                const label = `${weekday} ${d.getDate()}`;
                out.push({ label, iso, weekday });
            }
        }
        
        // Fallback: if no showtimes, show next 7 days
        if (out.length === 0) {
            const now = new Date();
            for (let i = 0; i < 7; i++) {
                const d = new Date(now);
                d.setDate(now.getDate() + i);
                const iso = d.toISOString().split('T')[0];
                const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
                const label = `${weekday} ${d.getDate()}`;
                out.push({ label, iso, weekday });
            }
        }
        
        return out;
    }, [showTimes]);

    const [selectedDateIdx, setSelectedDateIdx] = useState(0);
    const selectedDate = dates[selectedDateIdx];

    // languages from movie details if available
    const languages: { code: string; name: string }[] = (movie?.languages ?? movie?.spoken_languages ?? []).map((l: any) => 
        typeof l === 'string' 
            ? { code: l.toUpperCase(), name: l } 
            : { code: l.iso_639_1 ?? String(l.code ?? '').toUpperCase(), name: l.english_name ?? l.name ?? 'Unknown' }
    );
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(languages[0]?.code ?? null);

    // Get showtimes for a specific hall filtered by selected date
    const getShowTimesForHall = (hallId: string) => {
        return showTimes.filter((st) => {
            if (st.hallId !== hallId) return false;
            // Filter by selected date
            const stDate = new Date(st.startTime).toISOString().split('T')[0];
            return stDate === selectedDate?.iso;
        });
    };

    // Get halls that have showtimes for this movie
    const hallsWithShowTimes = useMemo(() => {
        const hallIds = [...new Set(showTimes.map((st) => st.hallId))];
        return hallIds;
    }, [showTimes]);

    // Get theatres that have halls with showtimes
    const theatresWithShowTimes = useMemo(() => {
        return theatres.filter((theatre) => 
            theatre.halls?.some((hall: any) => hallsWithShowTimes.includes(hall.id))
        );
    }, [theatres, hallsWithShowTimes]);

    console.log('hallsWithShowTimes:', hallsWithShowTimes);
    console.log('theatresWithShowTimes:', theatresWithShowTimes);
    console.log('selectedDate:', selectedDate);

    // sorting mode for theatres
    const [sortMode, setSortMode] = useState<'nearest' | 'name'>('nearest');

    const parseDistance = (d: string) => {
        const num = parseFloat(String(d).replace(',', '.'));
        return Number.isFinite(num) ? num : 99999;
    };

    const sortedTheatres: any[] = React.useMemo(() => {
        const copy = [...theatresWithShowTimes];
        if (sortMode === 'nearest') {
            // For now just sort by name since we don't have distance from API
            copy.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        } else {
            copy.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        }
        return copy;
    }, [theatres, sortMode]);


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
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 140 : 120 }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <ArrowLeft color="#fff" size={24} />
                        </TouchableOpacity>
                        <Text style={{ color: '#fff', fontSize: 18 }}>Schedule of {movie?.title ?? 'Loading...'}</Text>
                    </View>
                    <View style={styles.container}>
                        {/* header */}
                        <View style={[styles.headerRow, styles.headerHero]}>
                            <Image source={
                                movie?.backdropPath ? { uri: movie.backdropPath } : movie?.backdrop_path ? { uri: `https://image.tmdb.org/t/p/w342${movie.backdrop_path}` } : undefined
                            } style={styles.backdrop} />
                            <LinearGradient style={styles.backdrop} colors={['transparent', 'rgba(0, 0, 0, 0.8)']} />
                            <Image source={
                                movie?.posterPath ? { uri: movie.posterPath } : movie?.poster_path ? { uri: `https://image.tmdb.org/t/p/w342${movie.poster_path}` } : undefined
                            } style={styles.poster} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.title}>{movie?.title ?? 'Loading...'}</Text>
                                <Text style={[styles.subtitle, { marginTop: 8 }]}>Release: {movie?.releaseDate ? new Date(movie.releaseDate).toLocaleDateString() : ''}</Text>
                                <Text style={[styles.small, { marginTop: 6 }]}>Duration: {movie?.duration ? `${movie.duration} min` : ''}</Text>
                                <Text style={[styles.small, { marginTop: 6 }]}>Rating: {movie?.averageRating ? `${movie.averageRating.toFixed(1)}/10` : ''}</Text>
                            </View>
                        </View>

                        {/* dates */}
                        <View style={{ marginTop: 18 }}>
                            <Text style={styles.sectionTitle}>Select date</Text>
                            <FlatList
                                horizontal
                                data={dates}
                                keyExtractor={(d) => d.iso}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        onPress={() => setSelectedDateIdx(index)}
                                        style={[styles.dateChip, index === selectedDateIdx && styles.dateChipActive]}
                                    >
                                        <Text style={[styles.dateChipText, index === selectedDateIdx && styles.dateChipTextActive]}>{item.label}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        {/* languages */}
                        <View style={{ marginTop: 12, paddingHorizontal: 12 }}>
                            <Text style={styles.sectionTitle}>Language</Text>
                            <View style={{ flexDirection: 'row', marginTop: 8 }}>
                                {(languages.length ? languages : [{ code: 'EN', name: 'English' }]).map((l) => (
                                    <TouchableOpacity
                                        key={l.code}
                                        onPress={() => setSelectedLanguage(l.code)}
                                        style={[styles.langChip, selectedLanguage === l.code && styles.langChipActive]}
                                    >
                                        <Text style={[styles.langText, selectedLanguage === l.code && styles.langTextActive]}>{l.code} </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* theatres */}
                        <View style={{ marginTop: 18, paddingHorizontal: 12 }}>
                            {/* sort controls */}
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
                                <TouchableOpacity style={[styles.sortButton, sortMode === 'nearest' && styles.sortButtonActive]} onPress={() => setSortMode('nearest')}>
                                    <Text style={[styles.sortButtonText, sortMode === 'nearest' && styles.sortButtonTextActive]}>Nearest</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.sortButton, sortMode === 'name' && styles.sortButtonActive]} onPress={() => setSortMode('name')}>
                                    <Text style={[styles.sortButtonText, sortMode === 'name' && styles.sortButtonTextActive]}>Name</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.sectionTitle}>Theatres</Text>

                            {sortedTheatres.length === 0 ? (
                                <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 12 }}>No showtimes available for this date</Text>
                            ) : (
                                sortedTheatres.map((theatre) => {
                                    // Get halls for this theatre that have showtimes
                                    const hallsWithTimes = (theatre.halls ?? []).filter((hall: any) => 
                                        getShowTimesForHall(hall.id).length > 0
                                    );

                                    if (hallsWithTimes.length === 0) return null;

                                    return (
                                        <View key={theatre.id} style={styles.theatreCard}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={{ marginLeft: 12, flex: 1 }}>
                                                    <Text style={styles.theatreName}>{theatre.name}</Text>
                                                    <Text style={styles.theatreSub}>{theatre.address ?? ''}</Text>
                                                </View>
                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <Text style={styles.small}>{selectedDate?.iso}</Text>
                                                </View>
                                            </View>

                                            {hallsWithTimes.map((hall: any) => {
                                                const hallShowTimes = getShowTimesForHall(hall.id);
                                                return (
                                                    <View key={hall.id} style={{ marginTop: 12 }}>
                                                        <Text style={styles.roomLabel}>{hall.name} ({hall.rows}x{hall.columns} seats)</Text>
                                                        {hallShowTimes.map((showTime) => {
                                                            const startDate = new Date(showTime.startTime);
                                                            const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                            return (
                                                                <View key={showTime.id} style={styles.timeRow}>
                                                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                                        <View style={{ marginLeft: 12 }}>
                                                                            <Text style={styles.timeRowTime}>{timeStr}</Text>
                                                                            <Text style={styles.small}>{selectedDate?.iso} • ${showTime.basePrice}</Text>
                                                                        </View>
                                                                    </View>
                                                                    <View style={{ alignItems: 'flex-end' }}>
                                                                        <Text style={styles.priceLabel}>${showTime.basePrice}</Text>
                                                                        <TouchableOpacity
                                                                            style={styles.buyButton}
                                                                            onPress={() => router.push({ 
                                                                                pathname: '/seats', 
                                                                                params: { 
                                                                                    movieId: String(movie_id), 
                                                                                    showTimeId: showTime.id,
                                                                                    theatreId: theatre.id, 
                                                                                    hallId: hall.id,
                                                                                    date: selectedDate.iso, 
                                                                                    time: timeStr, 
                                                                                    price: String(showTime.basePrice)
                                                                                } 
                                                                            })}
                                                                        >
                                                                            <Text style={styles.buyButtonText}>Buy</Text>
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    );
                                })
                            )}
                        </View>

                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient >
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 8, backgroundColor: 'rgba(1, 1, 1, 0.35)' },
    headerHero: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.02)' },
    buyButton: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#ffb400' },
    buyButtonText: { color: '#000', fontWeight: '800' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    poster: { width: POSTER_W, height: POSTER_W * 1.5, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)' },
    title: { color: '#fff', fontSize: 18, fontWeight: '800' },
    subtitle: { color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    header: { marginBottom: 12, marginHorizontal: "5%", flexDirection: 'row', alignItems: 'center', gap: 12 },
    small: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
    sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    dateChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', marginRight: 8 },
    dateChipActive: { backgroundColor: '#fff' },
    dateChipText: { color: 'rgba(255,255,255,0.8)' },
    dateChipTextActive: { color: '#000', fontWeight: '700' },
    langChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)', marginRight: 8 },
    langChipActive: { backgroundColor: '#fff' },
    langText: { color: 'rgba(255,255,255,0.8)' },
    langTextActive: { color: '#000', fontWeight: '700' },
    theatreCard: { padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)', marginTop: 12 },
    theatreAvatar: { width: 48, height: 48, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)' },
    theatreAvatarSmall: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)' },
    theatreName: { color: '#fff', fontSize: 15, fontWeight: '700' },
    theatreSub: { color: 'rgba(255,255,255,0.6)', marginTop: 4, fontSize: 12 },
    timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: 8 },
    timeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#ffb400', marginRight: 8 },
    timeRowTime: { color: '#fff', fontSize: 16, fontWeight: '800' },
    roomLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
    priceLabel: { color: '#ffb400', fontSize: 14, fontWeight: '700' },
    sortButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginLeft: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    sortButtonActive: { backgroundColor: 'rgba(255,255,255,0.06)' },
    sortButtonText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    sortButtonTextActive: { color: '#fff', fontWeight: '700' },
});

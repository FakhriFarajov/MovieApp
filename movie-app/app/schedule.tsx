import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
import { fetchMovieById } from './api/movies.api';
import { useFetch } from './api/useFetch';

const { width } = Dimensions.get('window');
const POSTER_W = Math.min(140, Math.floor(width * 0.26));

export default function ScheduleScreen() {
    const { colorScheme } = useTheme();
    const router = useRouter();
    const { movie_id } = useLocalSearchParams<{ movie_id: string }>();
    const parsedMovieId = Number(movie_id);

    const { data: movie, loading } = useFetch<any>(() =>
        fetchMovieById(String(parsedMovieId))
    );
    console.log('movie details for schedule', { movie_id: parsedMovieId, movie, loading });

    // build next 7 days starting from today
    const dates = useMemo(() => {
        const out: { label: string; iso: string; weekday: string }[] = [];
        const now = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(now);
            d.setDate(now.getDate() + i);
            const iso = d.toISOString().split('T')[0];
            const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
            const label = `${weekday} ${d.getDate()}`;
            out.push({ label, iso, weekday });
        }
        return out;
    }, []);

    const [selectedDateIdx, setSelectedDateIdx] = useState(0);
    const selectedDate = dates[selectedDateIdx];

    // languages from movie details if available
    const languages: { code: string; name: string }[] = (movie?.spoken_languages ?? []).map((l: any) => ({ code: l.iso_639_1 ?? String(l.code ?? '').toUpperCase(), name: l.english_name ?? l.name ?? 'Unknown' }));
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(languages[0]?.code ?? null);

    // mock theatre data — in a real app this comes from a backend
    const theatres = useMemo(() => {
        const base = [
            { id: 't1', name: 'Cineplex Downtown', distance: '1.2 km' },
            { id: 't2', name: 'Grand Cinema Mall', distance: '3.1 km' },
            { id: 't3', name: 'Riverside Screens', distance: '5.4 km' },
        ];
        // attach available languages (pick movie languages or fallback)
        return base.map((t) => ({
            ...t,
            languages: languages.length ? languages.map((l) => l.code) : ['EN'],
            rooms: ['Room 1', 'Room 2'],
        }));
    }, [languages]);

    // simple showtimes generator for a theatre/date/language
    const showtimesFor = (theatreId: string, dateIso: string, language: string | null) => {
        // produce 4 times per day offset by theatreId
        const baseHours = [11, 14, 17, 20];
        return baseHours.map((h, i) => {
            const hh = h + (theatreId.charCodeAt(1) % 3);
            const mins = i % 2 === 0 ? '00' : '30';
            return `${String(hh).padStart(2, '0')}:${mins}`;
        });
    };

    // sorting mode for theatres
    const [sortMode, setSortMode] = useState<'nearest' | 'name'>('nearest');

    const parseDistance = (d: string) => {
        const num = parseFloat(String(d).replace(',', '.'));
        return Number.isFinite(num) ? num : 99999;
    };

    const sortedTheatres: any[] = React.useMemo(() => {
        const copy = [...theatres];
        if (sortMode === 'nearest') {
            copy.sort((a, b) => parseDistance(a.distance) - parseDistance(b.distance));
        } else {
            copy.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        }
        return copy;
    }, [theatres, sortMode]);

    if (!movie_id || Number.isNaN(parsedMovieId)) {
        return (
            <LinearGradient colors={["#070312", "#100428"]} style={{ flex: 1 }}>
                <SafeAreaView style={styles.center}>
                    <Text style={{ color: '#fff' }}>Invalid movie</Text>
                </SafeAreaView>
            </LinearGradient>
        );
    }

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
                                <Text style={styles.subtitle}>Release: {movie?.release_date ?? ''}</Text>
                                <Text style={styles.small}>Country: {movie?.origin_country ?? ''}</Text>
                                <Text style={styles.small}>Duration: {movie?.runtime ? `${movie.runtime}m` : ''}</Text>
                                <Text style={styles.small}>Popularity: {movie?.vote_average ? `${(movie.vote_average * 10).toFixed(0)}%` : ''}</Text>

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

                            {sortedTheatres.map((t) => (
                                <View key={t.id} style={styles.theatreCard}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ marginLeft: 12, flex: 1 }}>
                                            <Text style={styles.theatreName}>{t.name}</Text>
                                            <Text style={styles.theatreSub}>{t.distance} • {t.rooms.join(', ')}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.small}>{selectedDate?.iso}</Text>
                                        </View>
                                    </View>

                                    <View style={{ marginTop: 12 }}>
                                        {showtimesFor(t.id, selectedDate.iso, selectedLanguage).map((time) => (
                                            <View key={`${t.id}-${time}`} style={styles.timeRow}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                    <View style={{ marginLeft: 12 }}>
                                                        <Text style={styles.timeRowTime}>{time}</Text>
                                                        <Text style={styles.small}>{selectedDate?.iso} • {selectedLanguage ?? 'EN'}</Text>
                                                    </View>
                                                </View>
                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <Text style={styles.roomLabel}>{t.rooms[0]}</Text>
                                                    <TouchableOpacity
                                                        style={styles.buyButton}
                                                        onPress={() => router.push({ pathname: '/seats', params: { movieId: String(parsedMovieId), theatreId: t.id, date: selectedDate.iso, time, language: selectedLanguage } })}
                                                    >
                                                        <Text style={styles.buyButtonText}>Buy</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ))}
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
    sortButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginLeft: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    sortButtonActive: { backgroundColor: 'rgba(255,255,255,0.06)' },
    sortButtonText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    sortButtonTextActive: { color: '#fff', fontWeight: '700' },
});

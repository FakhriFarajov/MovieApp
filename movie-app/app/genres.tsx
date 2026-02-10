import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchGenres } from './api/genres.api';
import { useFetch } from './api/useFetch';
import { Genre } from './types/genresList';

export default function GenreScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();

  // create theme-aware styles and quick color helpers
  const styles = getStyles((colorScheme as 'light' | 'dark') ?? 'dark');
  const themeMode = layoutTheme.modes?.[(colorScheme as 'light' | 'dark')] ?? layoutTheme.modes.dark;
  const textColor = themeMode?.text?.primary ?? '#FFFFFF';
  const errorColor = layoutTheme.colors?.text?.error ?? '#C64949';

  // API now returns an array of genres, e.g. [{ id: '...', name: 'Fantasy' }, ...]
  const { data, loading, error } = useFetch<Genre[]>(() => fetchGenres());

  // accept string or number ids from the backend
  const onSeeAll = (genreId: number | string) => {
    router.push({
      pathname: '/search-results',
      params: { genreIds: genreId.toString() },
    });
  };

  return (
    <LinearGradient
      colors={
        colorScheme === "dark"
          ? layoutTheme.colors.gradients.darkPrimary as any
          : layoutTheme.colors.gradients.lightPrimary as any
      }
      start={{ x: 0.50, y: 0.00 }}
      end={{ x: 0.50, y: 1.00 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={styles.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft color={textColor} />
              </TouchableOpacity>
              <Text style={styles.header}>Genres</Text>
            </View>
            {loading && <Text style={{ color: textColor }}>Loading genres...</Text>}
            {error && <Text style={{ color: errorColor }}>Error loading genres</Text>}

            {data?.map((g: Genre) => (
              <View key={`g-${g.id}`} style={{ marginTop: 12 }}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowTitle}>{g.name}</Text>
                  <TouchableOpacity onPress={() => onSeeAll(g.id)}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// theme-aware style factory
const getStyles = (colorScheme: keyof typeof layoutTheme.modes) => {
  const themeMode = layoutTheme.modes?.[colorScheme] ?? layoutTheme.modes.dark;
  const textColor = themeMode?.text?.primary ?? '#FFFFFF';
  const subText = themeMode?.text?.secondary ?? 'rgba(194,194,194,1)';

  return StyleSheet.create({
    container: { paddingTop: 16, paddingHorizontal: 12 },
    header: { color: textColor, fontSize: 22, fontWeight: '700', textAlign: 'left' },
    rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: '2%' },
    rowTitle: { color: textColor, fontSize: 16, fontWeight: '700' },
    seeAll: { color: subText, fontSize: 14 },
  });
};
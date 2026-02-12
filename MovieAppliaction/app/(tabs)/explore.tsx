import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Keyboard, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SecureStore from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { setLastSearch } from '../lib/searchState';
import { useTheme } from '@/hooks/use-theme';
import { layoutTheme } from '@/constant/theme';

const RECENT_KEY = '@movieapp:recent_searches_v1';

export default function Explore() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const { colorScheme } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItem(RECENT_KEY);
        if (raw) setRecent(JSON.parse(raw));
      } catch (e) {}
    })();
  }, []);

  const saveQuery = async (q: string) => {
    if (!q || q.trim().length === 0) return;
    const normalized = q.trim();
    const updated = [normalized, ...recent.filter(r => r !== normalized)].slice(0, 12);
    setRecent(updated);
    try {
      await SecureStore.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const onSubmit = (q?: string) => {
    const submitted = (q ?? query).trim();
    if (!submitted) return;

    saveQuery(submitted);
    setLastSearch(submitted);
    setQuery('');
    Keyboard.dismiss();

    // Redirect to search-results with query param
    router.push({
      pathname: '/search-results',
      params: { movieName: submitted },
    });
  };

  const clearRecent = async () => {
    setRecent([]);
    try { await SecureStore.removeItem(RECENT_KEY); } catch (e) {}
  };

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
        <View style={styles.container}>
          <Text style={styles.header}>Search</Text>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <SearchIcon color="#9aa0b4" size={16} />
              <TextInput
                placeholder="Search movies, actors, genres..."
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => onSubmit()}
                returnKeyType="search"
                style={styles.input}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={{ padding: 6 }}>
                  <X color="#9aa0b4" size={14} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => onSubmit()} style={styles.searchBtn}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Go</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.subheader}>Recent searches</Text>
              <TouchableOpacity onPress={clearRecent}><Text style={{ color: '#8b8b9a' }}>Clear</Text></TouchableOpacity>
            </View>

            <FlatList
              data={recent}
              keyExtractor={item => item}
              contentContainerStyle={{ paddingVertical: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => onSubmit(item)} style={styles.recentItem}>
                  <Text style={{ color: '#fff' }}>{item}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (<Text style={{ color: '#8b8b9a', marginTop: 12 }}>No recent searches</Text>)}
            />
          </View>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 12, flex: 1 },
  header: { color: '#fff', fontSize: 22, fontWeight: '800' },
  searchRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: Platform.OS === 'android' ? 6 : 10, borderRadius: 12 },
  input: { color: '#fff', marginLeft: 8, flex: 1, fontSize: 14 },
  searchBtn: { marginLeft: 8, backgroundColor: '#7c3aed', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  subheader: { color: '#fff', fontSize: 16, fontWeight: '700' },
  recentItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
});

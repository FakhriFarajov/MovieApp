import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HeaderBar from './components/header-bar';

export default function FullMapPage() {
  const { lat, lng, name } = useLocalSearchParams() as { lat?: string; lng?: string; name?: string };
  const router = useRouter();
  const { colorScheme } = useTheme();
  const [MapModule, setMapModule] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const latitude = lat ? Number(lat) : 37.78825;
  const longitude = lng ? Number(lng) : -122.4324;
  const placeName = name ? String(name) : 'Location';

  const gradient =
    colorScheme === 'dark'
      ? (layoutTheme.colors.gradients.darkPrimary as any)
      : (layoutTheme.colors.gradients.lightPrimary as any);

  const styles = getStyles((colorScheme as 'light' | 'dark') ?? 'dark');

  useEffect(() => {
    try {
      // dynamic require so app won't crash when native maps missing
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require('react-native-maps');
      setMapModule(m);
    } catch (e) {
      setError('Maps native module not available.');
    }
  }, []);

  return (
    <LinearGradient colors={gradient} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <HeaderBar />

        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{placeName}</Text>
          <View style={{ width: 64 }} />
        </View>

        <View style={styles.mapWrapper}>
          {MapModule ? (
            (() => {
              const MapView = MapModule.default ?? MapModule.MapView ?? MapModule;
              const Marker = MapModule.Marker ?? MapModule.default?.Marker ?? MapModule.Marker;
              return (
                <MapView
                  style={StyleSheet.absoluteFill}
                  initialRegion={{ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
                  showsUserLocation={false}
                >
                  <Marker coordinate={{ latitude, longitude }} title={placeName} />
                </MapView>
              );
            })()
          ) : (
            <View style={styles.fallback}>
              <Text style={styles.fallbackText}>{error ?? 'Map unavailable'}</Text>
              <Text style={styles.fallbackHint}>Install react-native-maps or open in a device that supports the native module.</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// theme-aware style factory
const getStyles = (colorScheme: keyof typeof layoutTheme.modes) => {
  const mode = layoutTheme.modes?.[colorScheme] ?? layoutTheme.modes.dark;
  const textColor = mode?.text?.primary ?? '#fff';
  const muted = mode?.text?.secondary ?? 'rgba(255,255,255,0.7)';
  const mapBg = colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.03)';

  return StyleSheet.create({
    container: { flex: 1 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 12 },
    backBtn: { padding: 8 },
    backText: { color: textColor, fontWeight: '700' },
    title: { color: textColor, fontSize: 16, fontWeight: '700' },
    mapWrapper: { flex: 1, margin: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: mapBg },
    fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    fallbackText: { color: textColor, fontWeight: '700', marginBottom: 8 },
    fallbackHint: { color: muted, textAlign: 'center' },
  });
};
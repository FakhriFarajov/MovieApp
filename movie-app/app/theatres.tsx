import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { fetchTheatres } from './api/theatres.api';
import { useFetch } from './api/useFetch';
import HeaderBar from './components/header-bar';

// adapt theatre shape to backend response
type Theatre = {
  id: string;
  name: string;
  address?: string;
  latitude?: string | number;
  longitude?: string | number;
  lat?: string | number;
  lng?: string | number;
  halls?: Array<{ id: string; name: string; rows?: number; columns?: number }>;
  rating?: number;
};

const SafeMap: React.FC<{ latitude: number; longitude: number }> = ({ latitude, longitude }) => {
  const [isReady, setIsReady] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission denied');
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        setIsReady(true);
      } catch (e) {
        setErrorMsg('Native Map Module Missing');
      }
    }
    init();
  }, []);

  if (errorMsg || !isReady || !location) {
    return (
      <View style={[styles.mapContainer, { backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center' }]}> 
        <Text style={{ color: '#666', fontSize: 10, textAlign: 'center' }}>
          {errorMsg || 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: latitude ?? location.coords.latitude,
          longitude: longitude ?? location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* show theatre marker if coords provided, otherwise show user location */}
        <Marker coordinate={{ latitude: latitude ?? location.coords.latitude, longitude: longitude ?? location.coords.longitude }} />
      </MapView>
    </View>
  );
};

const stylesMap = StyleSheet.create({
  mapContainer: { width: 110, height: 84, marginRight: 12, borderRadius: 8, overflow: 'hidden' },
});

export default function TheatresScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { data: theatresData, loading: theatresLoading, error: theatresError } = useFetch<Theatre[]>(() => fetchTheatres());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!mounted) return;
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // helper: compute distance in km (haversine)
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => v * Math.PI / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const renderItem = ({ item }: { item: Theatre }) => {
    const lat = Number(item.latitude ?? item.lat ?? userLocation?.latitude ?? NaN);
    const lng = Number(item.longitude ?? item.lng ?? userLocation?.longitude ?? NaN);
    const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng);
    const distanceKm = hasCoords && userLocation ? getDistanceKm(userLocation.latitude, userLocation.longitude, lat, lng) : null;

    return (
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? layoutTheme.colors.gradients.darkPrimary as any
            : layoutTheme.colors.gradients.darkPrimary as any
        }
        style={styles.card}
        start={[0, 0]}
        end={[1, 1]}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={() => {
          const destLat = hasCoords ? lat : (userLocation?.latitude ?? 37.78825);
          const destLng = hasCoords ? lng : (userLocation?.longitude ?? -122.4324);
          router.push((`/map?lat=${destLat}&lng=${destLng}&name=${encodeURIComponent(item.name)}`) as any);
        }}>
          <SafeMap latitude={hasCoords ? lat : (userLocation?.latitude ?? 37.78825)} longitude={hasCoords ? lng : (userLocation?.longitude ?? -122.4324)} />
        </TouchableOpacity>
        <View style={styles.cardBody}>
          <Text style={[styles.title, { color: ((layoutTheme.modes as any)[colorScheme]?.text?.primary) ?? '#fff' }]}>{item.name}</Text>
          <Text style={[styles.subtitle, { color: ((layoutTheme.modes as any)[colorScheme]?.text?.secondary) ?? 'rgba(255,255,255,0.75)' }]}>{item.address ?? '—'}</Text>
          <View style={styles.row}>
            <Text style={[styles.distance, { color: ((layoutTheme.modes as any)[colorScheme]?.text?.secondary) ?? 'rgba(255,255,255,0.85)' }]}>{distanceKm ? `${distanceKm.toFixed(1)} km` : '—'}</Text>
            {item.rating ? <Text style={[styles.rating, { color: ((layoutTheme.modes as any)[colorScheme]?.button?.accent?.bg) ?? layoutTheme.colors.accent?.[500] ?? '#E91E63' }]}>⭐ {item.rating}</Text> : <View />}
          </View>
        </View>
      </LinearGradient>
    );
  };

  return (
    <LinearGradient
      colors={
        colorScheme === 'dark'
          ? layoutTheme.colors.gradients.darkPrimary as any
          : layoutTheme.colors.gradients.lightPrimary as any
      }
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1, backgroundColor: ((layoutTheme.modes as any)[colorScheme]?.background?.primary) ?? '#11192A' }}
    >
      <SafeAreaView style={styles.container}>
        <HeaderBar />
        <View style={styles.content}>
          <Text style={[styles.screenTitle, { color: ((layoutTheme.modes as any)[colorScheme]?.text?.primary) ?? '#fff' }]}>Nearby Theatres</Text>
          <FlatList
            data={theatresData ?? []}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
          {theatresLoading && <Text style={{ color: '#aaa', marginTop: 12 }}>Loading theatres...</Text>}
          {theatresError && <Text style={{ color: '#ff6b6b', marginTop: 12 }}>Failed to load theatres</Text>}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, flex: 1 },
  screenTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, overflow: 'hidden' },
  mapContainer: { width: 110, height: 84, marginRight: 12, borderRadius: 8, overflow: 'hidden' },
  mapThumb: { flex: 1 },
  thumb: { width: 64, height: 64, borderRadius: 8, marginRight: 12 },
  cardBody: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  distance: { fontSize: 13 },
  rating: { fontSize: 13 },
  viewButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  viewText: { fontWeight: '700' },
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrderConfirmation() {
  const params = useLocalSearchParams();
  const orderId = params?.orderId as string | undefined;
  const [order, setOrder] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('orders');
        if (!mounted || !raw) return;
        const orders = JSON.parse(raw || '[]');
        const found = (orders || []).find((o: any) => String(o.id) === String(orderId));
        if (found) setOrder(found);
      } catch (e) {
        console.warn('Failed to load order', e);
      }
    })();
    return () => { mounted = false; };
  }, [orderId]);

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Order confirmation</Text>
          <Text style={styles.message}>Looking up your order...</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/home')}>
            <Text style={styles.buttonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.card}>
        <Text style={styles.title}>Order confirmed</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Movie</Text>
          <Text style={styles.value}>{order.movieTitle ?? '—'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Seats</Text>
          <Text style={styles.value}>{Array.isArray(order.seats) ? order.seats.join(', ') : String(order.seats ?? '—')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.value}>{Number(order.price ?? 0).toFixed(2)} AZN</Text>
        </View>

        {order.theatre ? (
          <View style={styles.section}>
            <Text style={styles.label}>Theatre</Text>
            <Text style={styles.value}>{order.theatre.name ?? ''} {order.theatre.address ? `— ${order.theatre.address}` : ''}</Text>
          </View>
        ) : null}

        {order.startTime ? (
          <View style={styles.section}>
            <Text style={styles.label}>Starts</Text>
            <Text style={styles.value}>{new Date(order.startTime).toLocaleString()}</Text>
          </View>
        ) : null}

        <View style={{ height: 20 }} />

        <TouchableOpacity style={styles.button} onPress={() => router.push('/profile')}>
          <Text style={styles.buttonText}>View in Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { marginTop: 8 }]} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  card: { padding: 24, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12 },
  message: { color: '#ddd', marginBottom: 12 },
  section: { width: '100%', marginBottom: 12, alignItems: 'flex-start' },
  label: { color: '#aaa', fontSize: 12, marginBottom: 4 },
  value: { color: '#fff', fontSize: 16, fontWeight: '600' },
  button: { width: '100%', backgroundColor: '#6200ee', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
});

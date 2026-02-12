import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OrderConfirmation() {
  const params = useLocalSearchParams();
  const orderId = params?.orderId as string | undefined;
  const seatLabels = params?.seatLabels as string | undefined;
  const totalPrice = params?.totalPrice as string | undefined;
  const seatCount = params?.seatCount as string | undefined;
  const status = params?.status as string | undefined;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.card}>
        <View style={styles.successIcon}>
          <Text style={{ fontSize: 48 }}>✅</Text>
        </View>
        
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>Your tickets have been booked successfully</Text>

        <View style={styles.detailsCard}>
          <View style={styles.section}>
            <Text style={styles.label}>Booking ID</Text>
            <Text style={styles.value}>#{orderId?.slice(0, 8) || '—'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Seats</Text>
            <Text style={styles.value}>{seatLabels || '—'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tickets</Text>
            <Text style={styles.value}>{seatCount || '0'} ticket(s)</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Total Paid</Text>
            <Text style={[styles.value, styles.price]}>${totalPrice || '0'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, styles.statusPaid]}>{status || 'Confirmed'}</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />

        <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.buttonText}>View All Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.buttonOutline, { marginTop: 12 }]} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.buttonOutlineText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  card: { padding: 24, alignItems: 'center' },
  successIcon: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24, textAlign: 'center' },
  detailsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  section: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  label: { color: '#888', fontSize: 14 },
  value: { color: '#fff', fontSize: 16, fontWeight: '600' },
  price: { color: '#9BD36D', fontSize: 18, fontWeight: '700' },
  statusPaid: { color: '#9BD36D' },
  qrContainer: {
    marginTop: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  qrTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 16 },
  qrImage: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
  },
  qrHint: { fontSize: 12, color: '#666', marginTop: 12, textAlign: 'center' },
  button: { 
    width: '100%', 
    backgroundColor: '#6200ee', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  buttonOutline: {
    width: '100%',
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonOutlineText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

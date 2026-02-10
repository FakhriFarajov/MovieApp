import useSeatsStore from '@/store/useSeats';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


// 1. Mock Data Configuration
const ROWS = ['1', '2', '3', '4', '5', '6'];
const SEATS_PER_ROW = 5;

// ticket prices
const PRICE_ADULT = 12; // USD
const PRICE_CHILD = 8;
const PRICE_FAMILY = 4;

const SeatSelection = () => {
  const [selectedSeats, setSelectedSeats] = useState(new Set());
  const [seatTypes, setSeatTypes] = useState<Record<string, string>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingSeat, setPendingSeat] = useState<string | null>(null);
  const params = useLocalSearchParams();
  const movieId = params?.movieId as string | undefined;

  // seats store selectors
  const storeSeats = useSeatsStore((s) => s.seats);
  const bookSeat = useSeatsStore((s) => s.bookSeat);
  const deleteSeat = useSeatsStore((s) => s.deleteSeat);

  const [currentUserEmail, setCurrentUserEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('currentUser');
        if (!mounted || !raw) return;
        const parsed = JSON.parse(raw);
        setCurrentUserEmail(parsed?.email ?? parsed?.emailAddress ?? undefined);
      } catch (e) {
        console.warn('Failed to load currentUser email', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // pre-select seats when navigated from an order
  React.useEffect(() => {
    const orderId = params?.orderId as string | undefined;
    if (!orderId) return;
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('orders');
        if (!raw || !mounted) return;
        const parsed = JSON.parse(raw);
        const order = (parsed || []).find((o: any) => String(o.id) === String(orderId));
        if (!order) return;
        const seatStr = order.seat as string | undefined;
        if (!seatStr) return;

        let seatId = '';
        if (/^\d+-\d+$/.test(seatStr)) {
          seatId = seatStr;
        } else {
          const m = String(seatStr).match(/^([A-Za-z]+)(\d+)$/);
          if (m) {
            const letter = m[1].toUpperCase()[0];
            const rowIndex = letter.charCodeAt(0) - 64; // A=>1
            const colNum = Number(m[2]);
            seatId = `${rowIndex}-${colNum}`;
          } else {
            seatId = seatStr; // fallback, may not match grid
          }
        }

        // mark as selected locally
        if (seatId) {
          setSelectedSeats(new Set([seatId]));
          setSeatTypes(s => ({ ...s, [seatId]: 'Adult' }));
          // persist booking to store for this movie
          try {
            const [r, c] = seatId.split('-').map((v) => Number(v));
            await bookSeat({ row: r, column: c }, currentUserEmail ?? 'guest', { bookingUserEmail: currentUserEmail, seatType: 'Adult', movieId });
          } catch (e) {
            console.warn('Failed to persist selected seat', e);
          }
        }
      } catch (e) {
        console.warn('Failed to load order seat', e);
      }
    })();
    return () => { mounted = false; };
  }, [params]);

  // derived pricing and counts
  const pricing = React.useMemo(() => {
    const counts: Record<string, number> = { Adult: 0, Child: 0, Family: 0 };
    Object.values(seatTypes).forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
    const subtotal = (counts.Adult || 0) * PRICE_ADULT + (counts.Child || 0) * PRICE_CHILD + (counts.Family || 0) * PRICE_FAMILY;
    const total = subtotal; // add fees/taxes here if needed
    return { counts, subtotal, total };
  }, [seatTypes]);

  const handleSeatPress = (seatId: string, isReserved: boolean) => {
    if (isReserved) return;
    setPendingSeat(seatId);
    setModalVisible(true);
  };

  const selectSeatType = (type: string) => {
    if (!pendingSeat) return;
    const newSelection = new Set(selectedSeats);
    newSelection.add(pendingSeat);
    setSelectedSeats(newSelection);
    setSeatTypes(s => ({ ...s, [pendingSeat as string]: type }));
    setPendingSeat(null);
    setModalVisible(false);
    // persist this seat type
    (async () => {
      try {
        const [row, col] = (pendingSeat as string).split('-').map((v) => Number(v));
        await bookSeat({ row, column: col }, currentUserEmail ?? 'guest', { bookingUserEmail: currentUserEmail, seatType: type, movieId });
      } catch (e) {
        console.warn('bookSeat failed', e);
      }
    })();
  };

  const removePendingSelection = () => {
    if (!pendingSeat) return;
    const newSelection = new Set(selectedSeats);
    newSelection.delete(pendingSeat);
    const newTypes = { ...seatTypes };
    delete newTypes[pendingSeat as string];
    setSeatTypes(newTypes);
    setSelectedSeats(newSelection);
    setPendingSeat(null);
    setModalVisible(false);
    // remove booking from store
    (async () => {
      try {
        const [row, col] = (pendingSeat as string).split('-').map((v) => Number(v));
        await deleteSeat({ row, column: col });
      } catch (e) {
        console.warn('deleteSeat failed', e);
      }
    })();
  };

  // compute reservations for this movie separated by who booked
  const reservedByCurrent = useMemo(() => new Set(storeSeats
    .filter(s => s.isBooked && String(s.movieId) === String(movieId) && s.bookingUserEmail === currentUserEmail)
    .map(s => `${s.row}-${s.column}`)
  ), [storeSeats, movieId, currentUserEmail]);

  const reservedByOthers = useMemo(() => new Set(storeSeats
    .filter(s => s.isBooked && String(s.movieId) === String(movieId) && s.bookingUserEmail && s.bookingUserEmail !== currentUserEmail)
    .map(s => `${s.row}-${s.column}`)
  ), [storeSeats, movieId, currentUserEmail]);

  // prefill selectedSeats for seats already reserved by the current user for this movie
  useEffect(() => {
    if (!currentUserEmail || !movieId) return;
    const pre = Array.from(reservedByCurrent);
    if (pre.length) {
      setSelectedSeats(new Set(pre));
      // restore seat types from store if available
      const types: Record<string,string> = {};
      storeSeats.forEach(s => {
        if (String(s.movieId) === String(movieId) && s.bookingUserEmail === currentUserEmail) {
          types[`${s.row}-${s.column}`] = s.seatType ?? 'Adult';
        }
      });
      setSeatTypes(s => ({ ...s, ...types }));
    }
  }, [reservedByCurrent, currentUserEmail, movieId, storeSeats]);

  const renderSeat = (rowLabel: any, col: any) => {
    const seatId = `${rowLabel}-${col}`;
    const isReservedOther = reservedByOthers.has(seatId);
    const isReservedCurrent = reservedByCurrent.has(seatId);
    const isReserved = isReservedOther; // only treat as reserved (disabled) when another user booked
    const isSelected = selectedSeats.has(seatId) || isReservedCurrent;

    let seatStyle = styles.seatAvailable;
    if (isReservedOther) seatStyle = styles.seatReserved;
    if (isSelected) seatStyle = styles.seatSelected;

    return (
      <TouchableOpacity
        key={seatId}
        style={[styles.seat, seatStyle]}
        onPress={() => handleSeatPress(seatId, isReserved)}
        disabled={isReserved}
      >
        <Text style={styles.seatText}>{col}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Seat options modal */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { router.back(); }}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
      </View>
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 280, backgroundColor: '#111', borderRadius: 12, padding: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>Select ticket type</Text>
            {['Adult', 'Child', 'Family'].map((t) => {
              const price = t === 'Adult' ? PRICE_ADULT : t === 'Child' ? PRICE_CHILD : PRICE_FAMILY;
              return (
                <TouchableOpacity key={t} onPress={() => selectSeatType(t)} style={{ paddingVertical: 12 }}>
                  <Text style={{ color: '#fff' }}>{t} — {price} AZN</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity onPress={removePendingSelection} style={{ marginTop: 8, paddingVertical: 10 }}>
              <Text style={{ color: '#ff6b6b' }}>Remove selection</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 8, paddingVertical: 10 }}>
              <Text style={{ color: '#aaa' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* The Screen Visual */}
      <View style={styles.screenContainer}>
        <View style={styles.screenCurve} />
        <Text style={styles.screenLabel}>SCREEN</Text>
      </View>

      {/* The Seating Grid */}
      <View style={styles.gridContainer}>
        {ROWS.map((row) => (
          <View key={row} style={styles.row}>
            <Text style={styles.rowLabel}>{row}</Text>
            {Array.from({ length: SEATS_PER_ROW }).map((_, index) =>
              renderSeat(row, index + 1)
            )}
          </View>
        ))}
      </View>

      {/* Legend & Checkout */}
      <View style={styles.footer}>
        {/* status legend */}
        <View style={styles.legend}>
          <LegendItem label="Available" color="#3b3b3b" />
          <LegendItem label="Reserved" color="#ff4d4d" />
          <LegendItem label="Selected" color="#6200ee" />
        </View>

        {/* pricing legend for ticket types */}
        <View style={styles.priceLegend}>
          <View style={styles.priceLegendItem}>
            <Text style={styles.legendText}>Adult {PRICE_ADULT} AZN</Text>
          </View>
          <View style={styles.priceLegendItem}>
            <Text style={styles.legendText}>Child {PRICE_CHILD} AZN</Text>
          </View>
          <View style={styles.priceLegendItem}>
            <Text style={styles.legendText}>Family {PRICE_FAMILY} AZN</Text>
          </View>
        </View>


        {/* Selected seats detail list */}
        {selectedSeats.size > 0 && (
          <View style={styles.selectedList}>
            <ScrollView
              horizontal
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {Array.from(selectedSeats as Set<string>).map((id) => {
                const idStr = String(id);
                const [row, col] = idStr.split('-');
                const t = (seatTypes as Record<string, string>)[idStr] ?? '—';
                const rus: Record<string, string> = { Adult: 'Adult', Child: 'Child', Family: 'Family', '—': '—' };
                return (
                  <Text key={idStr} style={styles.selectedItem}>{`Row ${row}, Place ${col} (${rus[t] || t})`}</Text>
                );
              })}
            </ScrollView>
            <Text style={styles.totalAzn}>{`Total: ${pricing.total} AZN`}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, selectedSeats.size === 0 ? { opacity: 0.5 } : null]}
          onPress={async () => {
            if (selectedSeats.size === 0) {
              Alert.alert('No seats', 'Please select at least one seat before buying.');
              return;
            }

            // ensure user has billing info
            try {
              const raw = await AsyncStorage.getItem('currentUser');
              const parsed = raw ? JSON.parse(raw) : null;
              const billing = parsed?.billing ?? parsed?.card ?? null;
              const hasBilling = billing && (billing.cardNumber || billing.cardNumberMasked || billing.cardName);
              if (!hasBilling) {
                // remove any seats the user just selected (but don't delete seats already reserved by this user)
                try {
                  const seatsToRemove = Array.from(selectedSeats as Set<string>).filter(id => {
                    const [rStr, cStr] = String(id).split('-');
                    const row = Number(rStr);
                    const column = Number(cStr);
                    const found = storeSeats.find(s => s.row === row && s.column === column && String(s.movieId) === String(movieId) && s.bookingUserEmail === currentUserEmail);
                    // remove if not found in store (not yet persisted) or found but has no bookingId (pending selection)
                    return !found || !found.bookingId;
                  });
                  const delTasks: Promise<void>[] = [];
                  seatsToRemove.forEach((id) => {
                    const [rStr, cStr] = String(id).split('-');
                    const row = Number(rStr);
                    const column = Number(cStr);
                    delTasks.push(deleteSeat({ row, column }));
                  });
                  if (delTasks.length) await Promise.all(delTasks);
                } catch (e) {
                  console.warn('Failed to remove pending seats when billing missing', e);
                }

                // clear local UI selection
                setSelectedSeats(new Set());
                setSeatTypes({});

                Alert.alert(
                  'Billing required',
                  'You need to add billing information in your Profile before purchasing seats.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Go to Profile', onPress: () => router.push('/profile') },
                  ]
                );
                return;
              }
            } catch (e) {
              console.warn('Failed to check billing info', e);
            }

            const bookingId = `bk-${Date.now()}`;
            try {
              // persist each selected seat
              const selected = Array.from(selectedSeats as Set<string>);
              const tasks: Promise<void>[] = [];
              selected.forEach((id) => {
                const [rStr, cStr] = String(id).split('-');
                const row = Number(rStr);
                const column = Number(cStr);
                const seatType = (seatTypes as Record<string,string>)[id] ?? 'Adult';
                tasks.push(bookSeat({ row, column }, currentUserEmail ?? 'guest', { bookingUserEmail: currentUserEmail, seatType, bookingId, movieId }));
              });
              await Promise.all(tasks);

              // create an order record and persist to AsyncStorage
              try {
                const rawOrders = await AsyncStorage.getItem('orders');
                const existing = rawOrders ? JSON.parse(rawOrders) : [];
                const order = {
                  id: bookingId,
                  movieTitle: (params as any)?.movieTitle ?? 'Movie',
                  date: new Date().toISOString().split('T')[0],
                  startTime: (params as any)?.startTime ?? null,
                  seats: selected,
                  price: pricing.total,
                  status: 'paid',
                  theatre: (params as any)?.theatre ?? null,
                  movieId: movieId ?? null,
                };
                const next = [order, ...existing];
                await AsyncStorage.setItem('orders', JSON.stringify(next));
              } catch (e) {
                console.warn('Failed to persist order', e);
              }

              // clear local selection
              setSelectedSeats(new Set());
              setSeatTypes({});

              // navigate to order confirmation page
              router.push({ pathname: '/order-confirmation', params: { orderId: bookingId } });
            } catch (e) {
              console.warn('Failed to book seats', e);
              Alert.alert('Error', 'Could not complete booking.');
            }
          }}
        >
          <Text style={styles.buttonText}>
            Buy
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const LegendItem = ({ label, color }: { label: string; color: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.seat, { backgroundColor: color, marginBottom: 0 }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { marginBottom: 12, marginHorizontal: "5%" },
  priceLegend: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  priceLegendItem: { alignItems: 'center' },
  pricesSummary: { alignItems: 'flex-start', marginBottom: 8 },
  selectedList: { paddingHorizontal: 8, marginBottom: 8 },
  selectedItem: { color: '#fff', fontSize: 14, marginBottom: 4 },
  totalAzn: { color: '#fff', fontWeight: '800', fontSize: 16, marginTop: 6 },
  screenContainer: { alignItems: 'center', marginBottom: 40 },
  screenCurve: {
    height: 10, width: '80%', backgroundColor: '#555',
    borderBottomLeftRadius: 50, borderBottomRightRadius: 50,
    shadowColor: '#fff', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10
  },
  screenLabel: { color: '#888', marginTop: 10, fontSize: 12, letterSpacing: 3 },
  gridContainer: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rowLabel: { color: '#555', marginRight: 10, width: 20 },
  seat: {
    width: 30, height: 30, margin: 4, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center'
  },
  seatAvailable: { backgroundColor: '#3b3b3b' },
  seatReserved: { backgroundColor: '#ff4d4d' },
  seatSelected: { backgroundColor: '#6200ee' },
  seatText: { color: '#fff', fontSize: 10 },
  footer: { marginTop: 'auto', paddingBottom: 20 },
  legend: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  legendItem: { alignItems: 'center' },
  legendText: { color: '#888', fontSize: 10, marginTop: 4 },
  button: { backgroundColor: '#6200ee', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  prices: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    color: '#fff',
    fontSize: 14,
    marginTop: 8
  }
});

export default SeatSelection;
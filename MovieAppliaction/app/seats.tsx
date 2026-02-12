import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchSeatsByShowTime } from './api/showtimes/seats.api';
import { Seat } from './api/showtimes/seats.types';
import { apiCallWithManualRefresh } from '@/shared/apiWithManualRefresh';


const SeatSelection = () => {
  const [selectedSeats, setSelectedSeats] = useState(new Set<string>());
  const params = useLocalSearchParams();
  const movieId = params?.movieId as string | undefined;
  const showTimeId = params?.showTimeId as string | undefined;
  const ticketPrice = Number(params?.price) || 0; // Get price from route params

  // API seats data
  const [apiSeats, setApiSeats] = useState<Seat[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [seatsError, setSeatsError] = useState<string | null>(null);

  // Fetch seats from API
  useEffect(() => {
    if (!showTimeId) {
      setLoadingSeats(false);
      return;
    }
    let mounted = true;
    setLoadingSeats(true);
    (async () => {
      try {
        const seats = await apiCallWithManualRefresh(() => fetchSeatsByShowTime(showTimeId));
        if (!mounted) return;
        setApiSeats(Array.isArray(seats) ? seats : []);
        setSeatsError(null);
      } catch (e) {
        if (!mounted) return;
        console.error('Failed to fetch seats', e);
        setSeatsError('Failed to load seats');
      } finally {
        if (mounted) setLoadingSeats(false);
      }
    })();
    return () => { mounted = false; };
  }, [showTimeId]);

  // Organize seats into rows
  const seatGrid = useMemo(() => {
    if (!apiSeats.length) return { rows: [], maxColumns: 0 };
    
    // Group by row number
    const rowMap = new Map<number, Seat[]>();
    let maxCol = 0;
    
    apiSeats.forEach((seat) => {
      if (!rowMap.has(seat.rowNumber)) {
        rowMap.set(seat.rowNumber, []);
      }
      rowMap.get(seat.rowNumber)!.push(seat);
      maxCol = Math.max(maxCol, seat.columnNumber);
    });
    
    // Sort each row by column
    rowMap.forEach((seats) => {
      seats.sort((a, b) => a.columnNumber - b.columnNumber);
    });
    
    // Create sorted rows array
    const rows = Array.from(rowMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([rowNum, seats]) => ({ rowNumber: rowNum, seats }));
    
    return { rows, maxColumns: maxCol };
  }, [apiSeats]);

  // derived pricing - use ticket price from params
  const pricing = React.useMemo(() => {
    const seatCount = selectedSeats.size;
    const total = seatCount * ticketPrice;
    return { seatCount, total };
  }, [selectedSeats.size, ticketPrice]);

  const handleSeatPress = (seatId: string, isReserved: boolean) => {
    if (isReserved) return;
    
    // Toggle seat selection directly without modal
    const newSelection = new Set(selectedSeats);
    if (newSelection.has(seatId)) {
      newSelection.delete(seatId);
    } else {
      newSelection.add(seatId);
    }
    setSelectedSeats(newSelection);
  };

  const renderSeat = (seat: Seat) => {
    const seatId = seat.seatId;
    const isReserved = seat.isTaken;
    const isSelected = selectedSeats.has(seatId);

    let seatStyle = styles.seatAvailable;
    if (isReserved) seatStyle = styles.seatReserved;
    if (isSelected) seatStyle = styles.seatSelected;

    return (
      <TouchableOpacity
        key={seatId}
        style={[styles.seat, seatStyle]}
        onPress={() => handleSeatPress(seatId, isReserved)}
        disabled={isReserved}
      >
        <Text style={styles.seatText}>{seat.label}</Text>
      </TouchableOpacity>
    );
  };

  // Get row letter from row number (1 -> A, 2 -> B, etc.)
  const getRowLabel = (rowNumber: number): string => {
    return String.fromCharCode(64 + rowNumber); // 1 -> A, 2 -> B, etc.
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { router.back(); }}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 16, marginLeft: 12 }}>Select Seats</Text>
        <Text style={{ color: '#888', fontSize: 14, marginLeft: 'auto' }}>${ticketPrice}/seat</Text>
      </View>

      {/* The Screen Visual */}
      <View style={styles.screenContainer}>
        <View style={styles.screenCurve} />
        <Text style={styles.screenLabel}>SCREEN</Text>
      </View>

      {/* The Seating Grid - Scrollable X and Y */}
      {loadingSeats ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={{ color: '#fff', marginTop: 12 }}>Loading seats...</Text>
        </View>
      ) : seatsError ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#ff4d4d' }}>{seatsError}</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.gridScrollContainer}
          contentContainerStyle={styles.gridScrollContent}
          showsVerticalScrollIndicator={true}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.gridHorizontalContent}
          >
            <View style={styles.gridContainer}>
              {seatGrid.rows.map((row) => (
                <View key={row.rowNumber} style={styles.row}>
                  <Text style={styles.rowLabel}>{getRowLabel(row.rowNumber)}</Text>
                  {row.seats.map((seat) => renderSeat(seat))}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}

      {/* Legend & Checkout */}
      <View style={styles.footer}>
        {/* status legend */}
        <View style={styles.legend}>
          <LegendItem label="Available" color="#3b3b3b" />
          <LegendItem label="Reserved" color="#ff4d4d" />
          <LegendItem label="Selected" color="#6200ee" />
        </View>

        {/* Selected seats detail list */}
        {selectedSeats.size > 0 && (
          <View style={styles.selectedList}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {Array.from(selectedSeats as Set<string>).map((seatId) => {
                // Find seat from apiSeats to get the label
                const seat = apiSeats.find(s => s.seatId === seatId);
                const label = seat?.label ?? seatId;
                return (
                  <View key={seatId} style={styles.selectedChip}>
                    <Text style={styles.selectedChipText}>{label}</Text>
                  </View>
                );
              })}
            </ScrollView>
            <Text style={styles.totalAzn}>{`${pricing.seatCount} seats × $${ticketPrice} = $${pricing.total}`}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, selectedSeats.size === 0 ? { opacity: 0.5 } : null]}
          onPress={() => {
            if (selectedSeats.size === 0) {
              Alert.alert('No seats', 'Please select at least one seat before buying.');
              return;
            }

            // Get seat labels for display
            const selected = Array.from(selectedSeats as Set<string>);
            const seatLabels = selected.map((seatId) => {
              const seat = apiSeats.find(s => s.seatId === seatId);
              return seat?.label ?? seatId;
            }).join(', ');

            // Navigate to checkout page
            router.push({
              pathname: '/checkout',
              params: {
                movieId: movieId ?? '',
                showTimeId: showTimeId ?? '',
                seats: selected.join(','),
                seatLabels,
                totalPrice: String(pricing.total),
                ticketPrice: String(ticketPrice),
                seatCount: String(pricing.seatCount),
              },
            });
          }}
        >
          <Text style={styles.buttonText}>
            Continue to Checkout
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
  header: { marginBottom: 12, marginHorizontal: "5%", flexDirection: 'row', alignItems: 'center' },
  priceLegend: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  priceLegendItem: { alignItems: 'center' },
  pricesSummary: { alignItems: 'flex-start', marginBottom: 8 },
  selectedList: { paddingHorizontal: 8, marginBottom: 12 },
  selectedItem: { color: '#fff', fontSize: 14, marginBottom: 4 },
  selectedChip: { 
    backgroundColor: '#6200ee', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16, 
    marginRight: 8 
  },
  selectedChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  totalAzn: { color: '#fff', fontWeight: '800', fontSize: 16, marginTop: 10 },
  screenContainer: { alignItems: 'center', marginBottom: 30 },
  screenCurve: {
    height: 10, width: '80%', backgroundColor: '#555',
    borderBottomLeftRadius: 50, borderBottomRightRadius: 50,
    shadowColor: '#fff', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10
  },
  screenLabel: { color: '#888', marginTop: 10, fontSize: 12, letterSpacing: 3 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridScrollContainer: { flex: 1, marginBottom: 12 },
  gridScrollContent: { flexGrow: 1 },
  gridHorizontalContent: { paddingHorizontal: 12 },
  gridContainer: { alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rowLabel: { color: '#555', marginRight: 10, width: 20, fontWeight: '600' },
  seat: {
    width: 28, height: 28, margin: 3, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center'
  },
  seatAvailable: { backgroundColor: '#3b3b3b' },
  seatReserved: { backgroundColor: '#ff4d4d' },
  seatSelected: { backgroundColor: '#6200ee' },
  seatText: { color: '#fff', fontSize: 8 },
  footer: { marginTop: 'auto', paddingBottom: 20 },
  legend: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
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
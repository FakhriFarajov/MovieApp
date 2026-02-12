import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard, Smartphone, Building2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { bookingRequestSchema, cardPaymentSchema } from './checkout.schema';
import { createBooking } from './api/bookings/bookings.api';
import { apiCallWithManualRefresh } from '@/shared/apiWithManualRefresh';
import { 
  sendBookingConfirmationNotification, 
  sendPaymentConfirmationNotification,
  scheduleShowtimeReminder 
} from '@/services/push-service';

type PaymentMethod = 'card' | 'mobile' | 'bank';

export default function CheckoutScreen() {
  const params = useLocalSearchParams();
  const movieId = params?.movieId as string | undefined;
  const showTimeId = params?.showTimeId as string | undefined;
  const seats = params?.seats as string | undefined; // comma-separated seat IDs
  const seatLabels = params?.seatLabels as string | undefined; // comma-separated labels
  const totalPrice = Number(params?.totalPrice) || 0;
  const ticketPrice = Number(params?.ticketPrice) || 0;
  const seatCount = Number(params?.seatCount) || 0;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Mobile payment state
  const [phoneNumber, setPhoneNumber] = useState('');

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const validateForm = (): boolean => {
    // Validate booking request
    const bookingResult = bookingRequestSchema.safeParse({
      showTimeId: showTimeId || '',
      movieId: movieId || '',
      seatIds: seats?.split(',') || [],
      paymentMethod,
    });

    if (!bookingResult.success) {
      const firstError = bookingResult.error.issues[0];
      Alert.alert('Validation Error', firstError.message);
      return false;
    }

    // Validate payment method specific fields
    if (paymentMethod === 'card') {
      const cardResult = cardPaymentSchema.safeParse({
        cardNumber,
        cardName,
        expiryDate,
        cvv,
      });
      if (!cardResult.success) {
        const firstError = cardResult.error.issues[0];
        Alert.alert('Invalid Card Details', firstError.message);
        return false;
      }
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const booking = await apiCallWithManualRefresh(() =>
        createBooking({
          showTimeId: showTimeId || '',
          movieId: movieId || '',
          seatIds: seats?.split(',') || [],
          paymentMethod,
        })
      );

      console.log('Booking created:', booking);

      const seatLabelsStr = booking.tickets.map(t => t.label).join(', ');

      // Send payment confirmation notification
      await sendPaymentConfirmationNotification({
        amount: booking.totalPrice,
        cardLast4: paymentMethod === 'card' ? cardNumber.slice(-4) : undefined,
        paymentMethod,
        bookingId: booking.id,
      });

      // Send booking confirmation notification
      await sendBookingConfirmationNotification({
        movieTitle: params?.movieTitle as string || 'Movie',
        theatreName: params?.theatreName as string,
        showTime: params?.startTime as string,
        ticketCount: booking.tickets.length,
        seatLabels: seatLabelsStr,
        totalPrice: booking.totalPrice,
        bookingId: booking.id,
      });

      // Schedule showtime reminder (1 hour before)
      if (params?.startTime) {
        await scheduleShowtimeReminder({
          movieTitle: params?.movieTitle as string || 'Movie',
          showTime: params.startTime as string,
          theatreName: params?.theatreName as string,
          seatLabels: seatLabelsStr,
          bookingId: booking.id,
          minutesBefore: 60,
        });
      }

      // Navigate to confirmation with booking data
      router.replace({
        pathname: '/order-confirmation',
        params: {
          orderId: booking.id,
          movieId,
          showTimeId,
          seats,
          seatLabels: seatLabelsStr,
          totalPrice: String(booking.totalPrice),
          seatCount: String(booking.tickets.length),
          status: booking.status,
          qrCode: booking.tickets[0]?.qrCode || '',
        },
      });
    } catch (error) {
      console.error('Payment failed', error);
      Alert.alert('Payment Failed', 'Unable to process your payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethodButton = (method: PaymentMethod, icon: React.ReactNode, label: string) => (
    <TouchableOpacity
      style={[styles.methodButton, paymentMethod === method && styles.methodButtonActive]}
      onPress={() => setPaymentMethod(method)}
    >
      {icon}
      <Text style={[styles.methodButtonText, paymentMethod === method && styles.methodButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Seats</Text>
            <Text style={styles.summaryValue}>{seatLabels || seats || '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price per seat</Text>
            <Text style={styles.summaryValue}>${ticketPrice}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quantity</Text>
            <Text style={styles.summaryValue}>{seatCount} seats</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${totalPrice}</Text>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.methodButtons}>
            {renderPaymentMethodButton('card', <CreditCard color={paymentMethod === 'card' ? '#000' : '#fff'} size={20} />, 'Card')}
          </View>
        </View>

        {/* Payment Form */}
        <View style={styles.section}>
          {paymentMethod === 'card' && (
            <>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#666"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="numeric"
                maxLength={19}
              />

              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#666"
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="words"
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#666"
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#666"
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </>
          )}

          {paymentMethod === 'mobile' && (
            <>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+994 XX XXX XX XX"
                placeholderTextColor="#666"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              <Text style={styles.hint}>You will receive an SMS to confirm the payment</Text>
            </>
          )}

          {paymentMethod === 'bank' && (
            <View style={styles.bankInfo}>
              <Text style={styles.bankText}>You will be redirected to your bank's secure payment page.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay ${totalPrice}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 100 },
  
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: { color: '#888', fontSize: 14 },
  summaryValue: { color: '#fff', fontSize: 14 },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  totalValue: { color: '#6200ee', fontSize: 18, fontWeight: '800' },

  section: { marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  
  methodButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  methodButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  methodButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  methodButtonTextActive: { color: '#000' },

  inputLabel: { color: '#888', fontSize: 12, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: { flex: 1 },
  hint: { color: '#666', fontSize: 12, marginTop: 8 },

  bankInfo: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 10,
    marginTop: 12,
  },
  bankText: { color: '#888', fontSize: 14, textAlign: 'center' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  payButton: {
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

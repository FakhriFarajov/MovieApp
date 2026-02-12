import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { User } from '@/store/useUsers';
import SecureStore from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Settings } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProfile } from '../api/profile/profile.api';
import { getBookings } from '../api/bookings/bookings.api';
import { Booking, EnrichedBooking } from '../api/bookings/bookings.types';
import { fetchShowTimeById } from '../api/showtimes/showtimes.api';
import { getDetails } from '../api/movies/movies.api';
import { apiCallWithManualRefresh } from '@/shared/apiWithManualRefresh';
import { getImageUrl } from '../lib/getImageUrl';

export default function Profile() {
  const [user, setUser] = useState<User>({ name: '', surname: '', email: '', password: '', profileImage: '' });
  const mountedRef = useRef(true);
  const { colorScheme } = useTheme();

  const styles = getStyles((colorScheme as 'light' | 'dark') ?? 'dark');

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [orders, setOrders] = useState<EnrichedBooking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<EnrichedBooking | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        // Try server first
        let profileData: any = null;
        try {
          profileData = await apiCallWithManualRefresh(() => getProfile());
        } catch (e) {
          profileData = null;
        }

        if (profileData) {
          if (!mountedRef.current) return;
          // normalize server profile to local User shape
          const normalized = {
            name: profileData.name ?? profileData.Name ?? '',
            surname: profileData.surname ?? profileData.Surname ?? '',
            email: profileData.email ?? profileData.Email ?? '',
            password: '',
            profileImage: profileData.profileImage ?? profileData.ProfileImageObjectName ?? profileData.avatar ?? '',
          };
          setUser(normalized);
          setSelectedImageUri(normalized.profileImage ?? null);

          // persist a local snapshot
          try {
            await SecureStore.setItem('currentUser', JSON.stringify(normalized));
          } catch (e) {
            // ignore
          }

          return;
        }

        // Fallback: load from SecureStore (offline / no-network)
        const raw = await SecureStore.getItem('currentUser');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!mountedRef.current) return;
        // normalize to User interface
        setUser((prev) => ({
          name: parsed.name ?? prev.name,
          surname: parsed.surname ?? prev.surname,
          email: parsed.email ?? prev.email,
          password: parsed.password ?? prev.password,
          profileImage: parsed.profileImage ?? parsed.avatar ?? prev.profileImage,
        }));
        setSelectedImageUri(parsed.profileImage ?? parsed.avatar ?? null);

      } catch (e) {
        console.warn('Failed to load currentUser', e);
      }
    })();
    return () => { mountedRef.current = false; };
  }, []);


  // load bookings from API and enrich with movie details
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const bookings = await apiCallWithManualRefresh(() => getBookings());
        console.log('Loaded bookings', bookings);
        if (!mounted || !bookings?.length) {
          setOrders([]);
          return;
        }

        // Enrich bookings with movie details
        const enrichedBookings: EnrichedBooking[] = await Promise.all(
          bookings.map(async (booking: Booking) => {
            try {
              // Get showtime to get movieId
              const showtime = await fetchShowTimeById(booking.showTimeId);
              if (!showtime?.movieId) return { ...booking };

              // Get movie details
              const movie = await getDetails(showtime.movieId);
              return {
                ...booking,
                movieId: showtime.movieId,
                movieTitle: movie?.title ?? 'Unknown Movie',
                posterPath: movie?.posterPath ?? undefined,
                startTime: showtime.startTime,
              };
            } catch (e) {
              console.warn('Failed to enrich booking', booking.id, e);
              return { ...booking };
            }
          })
        );

        if (!mounted) return;
        setOrders(enrichedBookings);
      } catch (e) {
        console.warn('Failed to load bookings', e);
        setOrders([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const loadProfileData = async () => {
    try {
      let profileData: any = null;
      try {
        profileData = await apiCallWithManualRefresh(() => getProfile());
      } catch (e) {
        profileData = null;
      }

      if (profileData) {
        const normalized = {
          name: profileData.name ?? profileData.Name ?? '',
          surname: profileData.surname ?? profileData.Surname ?? '',
          email: profileData.email ?? profileData.Email ?? '',
          password: '',
          profileImage: profileData.profileImage ?? profileData.ProfileImageObjectName ?? profileData.avatar ?? '',
        };
        setUser(normalized);
        setSelectedImageUri(normalized.profileImage ?? null);
        try {
          await SecureStore.setItem('currentUser', JSON.stringify(normalized));
        } catch (e) {}
      }

      // reload bookings from API and enrich with movie details
      try {
        const bookings = await apiCallWithManualRefresh(() => getBookings());
        if (bookings?.length) {
          const enrichedBookings: EnrichedBooking[] = await Promise.all(
            bookings.map(async (booking: Booking) => {
              try {
                const showtime = await fetchShowTimeById(booking.showTimeId);
                if (!showtime?.movieId) return { ...booking };
                const movie = await getDetails(showtime.movieId);
                return {
                  ...booking,
                  movieId: showtime.movieId,
                  movieTitle: movie?.title ?? 'Unknown Movie',
                  posterPath: movie?.posterPath ?? undefined,
                  startTime: showtime.startTime,
                };
              } catch (e) {
                return { ...booking };
              }
            })
          );
          setOrders(enrichedBookings);
        } else {
          setOrders([]);
        }
      } catch (e) {
        console.warn('Failed to refresh bookings', e);
      }
    } catch (e) {
      console.warn('Failed to refresh profile', e);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  }, []);

  // guard avatar uri to avoid passing empty string to Image
  const avatarUri = selectedImageUri ?? user.profileImage ?? null;

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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={['#7c3aed']}
            />
          }
        >
          <View style={styles.cardWrapper}>
            {/* Frosted glass card using BlurView. Install with: expo install expo-blur */}
            <BlurView intensity={35} tint="dark" style={styles.blurCard}>
             <Text style={[styles.title, { marginTop: 16, textAlign: 'left', paddingLeft: 16 }]}>Profile</Text>
             <View style={styles.profileCard}>
               <View style={styles.headerRow}>
                 <View style={styles.leftRow}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>{(user.name || 'U')[0].toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={styles.headerText}>
                    <Text style={styles.headerName}>{user.name}</Text>
                    <Text style={styles.headerEmail}>{user.email}</Text>
                  </View>
                </View>
                 <TouchableOpacity style={styles.settingsBtn} onPress={() => { router.push('/profile-settings'); }}>
                   <Settings color="#ffffff" size={20} />
                 </TouchableOpacity>
               </View>
               {/* Orders section */}
               <View style={{ width: '100%', marginTop: 18 }}>
                 <Text style={styles.sectionTitle}>My Bookings</Text>
                 {orders.length === 0 ? (
                   <Text style={styles.hint}>No bookings found.</Text>
                 ) : (
                   <View style={{ width: '100%' }}>
                     {orders.map((item) => {
                      // Get seat labels from tickets
                      const seatLabels = item.tickets.map(t => t.label).join(', ');
                      const ticketCount = item.tickets.length;
                      const isPaid = item.status.toLowerCase() === 'paid';
                      const posterUri = item.posterPath ? getImageUrl(item.posterPath, 'w185') : null;

                      return (
                        <TouchableOpacity 
                          key={String(item.id)}
                          style={[styles.orderRow, { alignItems: 'flex-start' }]}
                          onPress={() => {
                            setSelectedBooking(item);
                            setQrModalVisible(true);
                          }}
                        > 
                          {posterUri ? (
                            <Image source={{ uri: posterUri }} style={styles.orderThumbLarge} />
                          ) : (
                            <View style={[styles.orderThumbLarge, { alignItems: 'center', justifyContent: 'center' }]}> 
                              <Text style={{ color: '#aaa', fontSize: 24 }}>🎬</Text>
                            </View>
                          )}
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.orderTitle}>{item.movieTitle || `Booking #${item.id.slice(0, 8)}`}</Text>
                            <Text style={styles.orderMeta}>
                              {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'} • Seats: {seatLabels}
                            </Text>
                            <Text style={styles.orderMeta}>Total: ${item.totalPrice.toFixed(2)}</Text>
                            {item.startTime && (
                              <Text style={styles.timeText}>
                                {new Date(item.startTime).toLocaleDateString()} at {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            )}

                            <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                              <TouchableOpacity 
                                style={styles.viewSeatBtn} 
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setSelectedBooking(item);
                                  setQrModalVisible(true);
                                }}
                              >
                                <Text style={styles.viewSeatText}>View QR</Text>
                              </TouchableOpacity>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.orderStatus, isPaid ? { color: '#9BD36D' } : { color: '#FF6B6B' }]}>
                                  {item.status}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                 )}
               </View>
             </View>
           </BlurView>
          </View>
        </ScrollView>

        {/* QR Code Modal */}
        <Modal
          visible={qrModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setQrModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedBooking?.movieTitle || 'Your Tickets'}
              </Text>
              {selectedBooking?.startTime && (
                <Text style={styles.modalSubtitle}>
                  {new Date(selectedBooking.startTime).toLocaleDateString()} at {new Date(selectedBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
              
              <ScrollView style={{ maxHeight: 400, width: '100%' }} contentContainerStyle={{ alignItems: 'center' }}>
                {selectedBooking?.tickets.map((ticket, index) => (
                  <View key={ticket.ticketId} style={styles.ticketCard}>
                    <Text style={styles.ticketLabel}>Seat {ticket.label}</Text>
                    <Image 
                      source={{ uri: ticket.qrCode }} 
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.ticketPrice}>${ticket.price.toFixed(2)}</Text>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setQrModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}


 // replace static styles with factory that accepts color scheme
 const getStyles = (colorScheme: 'light' | 'dark') => {
  const themeMode = layoutTheme.modes?.[colorScheme] ?? layoutTheme.modes.dark;
  const textColor = themeMode?.text?.primary ?? '#FFFFFF';
  const subTextColor = themeMode?.text?.secondary ?? 'rgba(255,255,255,0.85)';
  const borderColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const inputBg = colorScheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)';
  const buttonBg = colorScheme === 'dark' ? layoutTheme.modes.dark.button?.accent?.bg ?? 'rgba(124,58,237,0.8)' : layoutTheme.modes.light.button?.accent?.bg ?? 'rgba(124,58,237,0.8)';

  return StyleSheet.create({
    cardWrapper: {
      flex: 1,
      width: '100%',
      paddingHorizontal: 24,
      paddingTop: 12,
    },
    leftRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    headerText: {
      marginLeft: 12,
    },
    headerName: {
      fontSize: 18,
      fontWeight: '700',
      color: textColor,
    },
    headerEmail: {
      fontSize: 14,
      color: subTextColor,
      marginTop: 4,
    },
    errorText: {
      color: '#ffb4b4',
      marginBottom: 8,
    },
    profileCard: {
      width: '100%',
      padding: 22,
      alignItems: 'center',
    },
    // fallback visual card when BlurView isn't available
    card: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 16,
      padding: 22,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 8,
    },
    // BlurView wrapper
    blurCard: {
      width: '100%',
      maxWidth: 480,
      borderRadius: 16,
      overflow: 'hidden',
      padding: 0,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
    },
    innerCard: {
      padding: 22,
      alignItems: 'center',
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: {
      width: '100%',
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
      color: textColor,
    },
    hint: {
      width: '100%',
      color: textColor,
      marginBottom: 12,
      textAlign: 'left',
      alignContent: 'flex-start',
    },
    input: {
      width: '100%',
      borderWidth: 1,
      borderColor,
      padding: 12,
      borderRadius: 10,
      marginBottom: 12,
      color: textColor,
      backgroundColor: inputBg,
    },
    primaryButton: {
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.12)',
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 8,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    linkButton: {
      marginTop: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linkButtonText: {
      color: textColor,
      fontSize: 16,
      fontWeight: '500',
    },
    section: {
      width: '100%',
      borderTopWidth: 1,
      borderTopColor: borderColor,
      paddingTop: 16,
      marginTop: 16,
    },
    sectionTitle: {
      width: '100%',
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
      marginBottom: 12,
      textAlign: 'left',
    },
    label: {
      width: '100%',
      color: subTextColor,
      marginBottom: 8,
      textAlign: 'left',
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarPlaceholder: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButton: {
      width: '100%',
      backgroundColor: buttonBg,
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 12,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    orderRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', alignItems: 'center' },
    orderThumb: { width: 60, height: 90, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)' },
    orderThumbLarge: { width: 80, height: 120, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)' },
    orderTitle: { color: textColor, fontWeight: '700' },
    orderMeta: { color: subTextColor, marginTop: 6 },
    theatreText: { color: subTextColor, marginTop: 6, fontSize: 13 },
    timeText: { color: subTextColor, marginTop: 4, fontSize: 12 },
    orderStatus: { fontWeight: '700', marginBottom: 8 },
    refundBtn: { marginTop: 6, backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
    refundText: { color: '#fff', fontWeight: '700' },
    viewSeatBtn: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewSeatText: {
      color: '#fff',
      fontWeight: '600',
    },
    nonRefundableText: {
      color: subTextColor,
      fontSize: 12,
      marginTop: 4,
    },
    // skeleton loader styles
    skeletonWrapper: {
      width: '100%',
      maxWidth: 480,
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 16,
    },
    skeletonCard: {
      width: '100%',
      padding: 22,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    skeletonAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 16,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    skeletonText: {
      width: '100%',
      height: 16,
      borderRadius: 8,
      marginBottom: 12,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    settingsBtn: { padding: 8 },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colorScheme === 'dark' ? '#1a1a2e' : '#fff',
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: textColor,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 14,
      color: subTextColor,
      marginBottom: 20,
      textAlign: 'center',
    },
    ticketCard: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      alignItems: 'center',
      width: '100%',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    ticketLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      marginBottom: 12,
    },
    qrImage: {
      width: 200,
      height: 200,
      backgroundColor: '#fff',
      borderRadius: 8,
    },
    ticketPrice: {
      fontSize: 14,
      color: subTextColor,
      marginTop: 12,
    },
    closeButton: {
      backgroundColor: buttonBg,
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 12,
      marginTop: 10,
    },
    closeButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
 };
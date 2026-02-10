import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { User } from '@/store/useUsers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Settings } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
  const [user, setUser] = useState<User>({ name: '', surname: '', email: '', password: '', profileImage: '' });
  const mountedRef = useRef(true);
  const { colorScheme } = useTheme();

  const styles = getStyles((colorScheme as 'light' | 'dark') ?? 'dark');

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [orders, setOrders] = useState<Array<any>>([]);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('currentUser');
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
        // keep billing loaded for form reset later
      } catch (e) {
        console.warn('Failed to load currentUser', e);
      }
    })();
    return () => { mountedRef.current = false; };
  }, []);


  // load orders from AsyncStorage (or use sample fallback)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('orders');
        if (!mounted) return;
        if (raw) {
          setOrders(JSON.parse(raw));
        } else {
          // no persisted orders — start with empty list
          setOrders([]);
        }
      } catch (e) {
        console.warn('Failed to load orders', e);
      }
    })();
    return () => { mounted = false; };
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
      {/* use a plain View here to avoid nesting VirtualizedLists (FlatList) inside a ScrollView */}
      <View style={styles.cardWrapper}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: '40%' }}>
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
                 <Text style={styles.sectionTitle}>Orders</Text>
                 {orders.length === 0 ? (
                   <Text style={styles.hint}>No orders found.</Text>
                 ) : (
                   <FlatList
                     data={orders}
                     keyExtractor={(i) => String(i.id)}
                     style={{ width: '100%' }}
                     nestedScrollEnabled={true}
                     renderItem={({ item }) => {

                      let timeLeftMs = 0;
                      let startsAtText = '';
                      try {
                        if (item.startTime) {
                          const start = new Date(item.startTime);
                          timeLeftMs = start.getTime() - Date.now();
                          const mins = Math.max(0, Math.floor(timeLeftMs / 60000));
                          const days = Math.floor(mins / 1440);
                          const hours = Math.floor((mins % 1440) / 60);
                          const remMins = mins % 60;
                          if (timeLeftMs > 0) {
                            if (days > 0) startsAtText = `Starts in ${days}d ${hours}h`;
                            else if (hours > 0) startsAtText = `Starts in ${hours}h ${remMins}m`;
                            else startsAtText = `Starts in ${remMins}m`;
                          } else {
                            startsAtText = `Started on ${start.toLocaleString()}`;
                          }
                        }
                      } catch (e) {
                        startsAtText = '';
                      }

                      const refundable = item.status === 'paid' && timeLeftMs > 0;

                      // support new orders that store seats as an array under `seats`
                      const seatLabel = Array.isArray(item.seats) ? (item.seats.join(', ')) : (item.seat ?? '—');

                      return (
                        <View style={[styles.orderRow, { alignItems: 'flex-start' }]}> 
                          <View style={[styles.orderThumbLarge, { alignItems: 'center', justifyContent: 'center' }]}> 
                            <Text style={{ color: '#aaa', fontSize: 12 }}>Poster</Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.orderTitle}>{item.movieTitle}</Text>
                            <Text style={styles.orderMeta}>{item.date} • Seats {seatLabel} • ${Number(item.price).toFixed(2)}</Text>
                            {item.theatre?.name && (
                              <Text style={styles.theatreText}>{item.theatre.name} — {item.theatre.address}</Text>
                            )}
                            {startsAtText ? <Text style={styles.timeText}>{startsAtText}</Text> : null}

                            <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                              <TouchableOpacity style={styles.viewSeatBtn} onPress={() => router.push({ pathname: '/seats', params: { orderId: item.id } })}>
                                <Text style={styles.viewSeatText}>View Seat</Text>
                              </TouchableOpacity>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.orderStatus, item.status === 'paid' ? { color: '#9BD36D' } : { color: '#FF6B6B' }]}>{item.status}</Text>
                                {refundable ? (
                                  <TouchableOpacity style={styles.refundBtn} onPress={() => {
                                    Alert.alert('Request refund', 'Do you want to request a refund for this order?', [
                                      { text: 'Cancel', style: 'cancel' },
                                      {
                                        text: 'Refund', style: 'destructive', onPress: async () => {
                                          try {
                                            // optimistic update
                                            const next = orders.map(o => o.id === item.id ? { ...o, status: 'refunded' } : o);
                                            setOrders(next);
                                            await AsyncStorage.setItem('orders', JSON.stringify(next));
                                            Alert.alert('Refund processed', 'Refund completed (demo).');
                                          } catch (e) {
                                            console.warn('refund error', e);
                                            Alert.alert('Error', 'Could not process refund.');
                                          }
                                        }
                                      }
                                    ]);
                                  }}>
                                    <Text style={styles.refundText}>Refund</Text>
                                  </TouchableOpacity>
                                ) : (
                                  // show non-refundable hint
                                  item.status === 'paid' ? <Text style={styles.nonRefundableText}>Not refundable</Text> : null
                                )}
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    }}
                  />
                 )}
               </View>
             </View>
           </BlurView>
         </SafeAreaView>
       </View>
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
  });
 };
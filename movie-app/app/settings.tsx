import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import HeaderBar from '../app/components/header-bar';
import { useTheme } from '@/hooks/use-theme';
import { layoutTheme } from '@/constant/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function settings() {
  const { colorScheme, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const router = useRouter();

  const onLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => router.replace('/pages/signin/auth') },
    ]);
  };

  const handleThemeChange = () => {
    toggleTheme(colorScheme === "dark" ? "light" : "dark");
    AsyncStorage.setItem('theme', colorScheme === "dark" ? "light" : "dark");
  };

  return (
    <LinearGradient
      colors={
        colorScheme === "dark"
          ? layoutTheme.colors.gradients.darkPrimary as any
          : layoutTheme.colors.gradients.lightPrimary as any
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <HeaderBar />

        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Settings</Text>

          <View style={styles.row}>
            <Text style={{ color: '#fff', marginRight: 12 }}>Dark Theme</Text>
            <View style={{ flex: 1 }} />
            <Switch
              value={ colorScheme === 'dark' }
              onValueChange={ handleThemeChange }
              thumbColor={ colorScheme === 'dark' ? '#fff' : '#fff'}
              trackColor={{ false: '#444', true: '#2a0b37ff' }}
            />
          </View>

          <View style={styles.row}>
            <Text style={{ color: '#fff', marginRight: 12 }}>Notifications</Text>
            <View style={{ flex: 1 }} />
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              thumbColor={notificationsEnabled ? '#fff' : '#fff'}
              trackColor={{ false: '#444', true: '#2a0b37ff' }}
            />
          </View>

          <View style={{ height: 20 }} />

          <TouchableOpacity style={styles.button} onPress={onLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}


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
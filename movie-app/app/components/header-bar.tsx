import { Bell, Menu } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSidebar } from './Sidebar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HeaderBar({
  badgeCount = 3,
  onMenuPress,
  onNotificationsPress,
}: {
  badgeCount?: number;
  onMenuPress?: () => void;
  onNotificationsPress?: () => void;
}) {
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await AsyncStorage.getItem('currentUser');
        if (res) {
          const user = JSON.parse(res);
          setUserName(user.name);
          setProfilePic(user.profileImage ? user.profileImage : null);
        }
      } catch (error) {
        console.error('Error occurred:', error);
      }
    }
    loadUser();
  }, []);
  const [userName, setUserName] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const sidebar = useSidebar();
  return (
    <View style={[styles.upperContainer, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 12 : 12 }]}>
      <View style={styles.leftHeader}>
        <Image source={profilePic ? { uri: profilePic } : require('../../assets/images/logo.png')} style={styles.logo} />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.appSmall}>Welcome back!</Text>
          <Text style={styles.appName}>{userName}</Text>
        </View>
      </View>

      <View style={styles.rightHeader}>
        <TouchableOpacity onPress={onNotificationsPress} style={[styles.iconButton, { marginLeft: 8 }]}>
          <Bell color="#fff" size={18} />
          <View style={styles.badge}><Text style={styles.badgeText}>{badgeCount}</Text></View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            try { onMenuPress && onMenuPress(); } catch (e) { }
            try { sidebar.toggle(); } catch (e) { }
          }}
          style={styles.iconButton}
        >
          <Menu color="#fff" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  upperContainer: {
    flexDirection: 'row',
    // use compact fixed paddings instead of percentage-based height/margins
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 8) : 8,
    paddingBottom: 8,
  },
  leftHeader: { flexDirection: 'row', alignItems: 'center' },
  rightHeader: { flexDirection: 'row', alignItems: 'center', width: 100, justifyContent: 'flex-end' },
  logo: { width: 36, height: 36, borderRadius: 32 },
  appName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  appSmall: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  iconButton: { width: 40, height: 40, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  badge: { position: 'absolute', right: 6, top: 6, minWidth: 16, height: 16, borderRadius: 32, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

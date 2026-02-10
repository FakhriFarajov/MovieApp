import { layoutTheme } from '@/constant/theme';
import { useTheme } from '@/hooks/use-theme';
import { User } from '@/store/useUsers';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BillingValues, profileSchema, ProfileValues } from './profileSchema/profile.schema';

export default function Profile() {
  const [user, setUser] = useState<User>({ name: '', surname: '', email: '', password: '', profileImage: '' });
  const mountedRef = useRef(true);
  const { colorScheme } = useTheme();

  const styles = getStyles((colorScheme as 'light' | 'dark') ?? 'dark');

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

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
      } catch (e) {
        console.warn('Failed to load currentUser', e);
      }
    })();
    return () => { mountedRef.current = false; };
  }, []);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission not granted to access media library');
        return;
      }

      Alert.alert('Upload Profile Photo', 'Choose an option', [
        {
          text: 'Take a photo',
          onPress: async () => {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraPermission.granted) {
              const image = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
              });

              if (!image.canceled) {
                const uri = image.assets?.[0]?.uri;
                if (uri) {
                  setSelectedImageUri(uri);
                  // persist immediately
                  try {
                    const raw = await AsyncStorage.getItem('currentUser');
                    const parsed = raw ? JSON.parse(raw) : null;
                    if (parsed) {
                      parsed.profileImage = uri;
                      await AsyncStorage.setItem('currentUser', JSON.stringify(parsed));
                    }
                    const usersRaw = await AsyncStorage.getItem('users');
                    if (usersRaw) {
                      const users = JSON.parse(usersRaw);
                      const idx = users.findIndex((u: any) => ((u.email ?? '').toLowerCase() === (parsed?.email ?? '').toLowerCase()));
                      if (idx >= 0) {
                        users[idx] = { ...users[idx], profileImage: uri };
                        await AsyncStorage.setItem('users', JSON.stringify(users));
                      }
                    }
                  } catch (e) {
                    console.warn('Failed to persist profile image', e);
                  }
                }
              }
            }
          },
        },
        {
          text: 'Choose from library',
          onPress: async () => {
            const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (libraryPermission.granted) {
              const image = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
              });
              if (!image.canceled) {
                const uri = image.assets?.[0]?.uri;
                if (uri) {
                  setSelectedImageUri(uri);
                  try {
                    const raw = await AsyncStorage.getItem('currentUser');
                    const parsed = raw ? JSON.parse(raw) : null;
                    if (parsed) {
                      parsed.profileImage = uri;
                      await AsyncStorage.setItem('currentUser', JSON.stringify(parsed));
                    }
                    const usersRaw = await AsyncStorage.getItem('users');
                    if (usersRaw) {
                      const users = JSON.parse(usersRaw);
                      const idx = users.findIndex((u: any) => ((u.email ?? '').toLowerCase() === (parsed?.email ?? '').toLowerCase()));
                      if (idx >= 0) {
                        users[idx] = { ...users[idx], profileImage: uri };
                        await AsyncStorage.setItem('users', JSON.stringify(users));
                      }
                    }
                  } catch (e) {
                    console.warn('Failed to persist profile image', e);
                  }
                }
              }
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ], { cancelable: true });
    } catch (err) {
      console.warn('pickImage error', err);
    }
  };

  // handle profile form save using react-hook-form
  const onSaveProfile = async (values: ProfileValues) => {
    try {
      const current: any = {
        name: values.name ?? '',
        surname: values.surname ?? '',
        email: values.email ?? '',
        profileImage: selectedImageUri ?? values.profileImage ?? '',
      };
      await AsyncStorage.setItem('currentUser', JSON.stringify(current));

      // update users array if present
      const usersRaw = await AsyncStorage.getItem('users');
      if (usersRaw) {
        const users = JSON.parse(usersRaw);
        const idx = users.findIndex((u: any) => ((u.email ?? '').toLowerCase() === (current.email ?? '').toLowerCase()));
        if (idx >= 0) {
          users[idx] = { ...users[idx], ...current };
          await AsyncStorage.setItem('users', JSON.stringify(users));
        }
      }

      // reflect changes in local state
      setUser((prev) => ({ ...prev, ...current }));
      Alert.alert('Profile saved', 'Your profile changes were saved.');
    } catch (e) {
      console.warn('Failed to save profile', e);
      Alert.alert('Error', 'Could not save profile.');
    }
  };

  // reset form values when user state loads
  React.useEffect(() => {
    try {
      resetProfile({
        name: user.name ?? '',
        surname: user.surname ?? '',
        email: user.email ?? '',
        profileImage: user.profileImage ?? '',
      });
      // reset billing form if we have stored billing
    } catch (e) { }
  }, [user]);


  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      surname: '',
      email: '',
      profileImage: '',
    },
  });

  const onSaveBilling = async (data: BillingValues) => {
    try {
      // persist billing info to currentUser
      const raw = await AsyncStorage.getItem('currentUser');
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed) {
        parsed.billing = {
          cardName: data.cardName,
          cardNumber: data.cardNumber,
          expiry: data.expiry,
          cvv: data.cvv,
        };
        await AsyncStorage.setItem('currentUser', JSON.stringify(parsed));
      }

      // update users array
      const usersRaw = await AsyncStorage.getItem('users');
      if (usersRaw) {
        const users = JSON.parse(usersRaw);
        const idx = users.findIndex((u: any) => ((u.email ?? '').toLowerCase() === (parsed?.email ?? '').toLowerCase()));
        if (idx >= 0) {
          users[idx] = { ...users[idx], billing: parsed.billing };
          await AsyncStorage.setItem('users', JSON.stringify(users));
        }
      }

      Alert.alert('Billing saved', 'Your billing information was saved.');
    } catch (e) {
      console.warn('Failed to save billing info', e);
      Alert.alert('Error', 'Could not save billing information.');
    }
  };

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
      <ScrollView style={styles.cardWrapper} >
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: '40%' }}>
          {/* Frosted glass card using BlurView. Install with: expo install expo-blur */}
          <BlurView intensity={35} tint="dark" style={styles.blurCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 16, marginLeft: 16 }}>
              <TouchableOpacity onPress={() => { router.back(); }}>
                <ChevronLeft color={(layoutTheme.modes as any)[colorScheme]?.text?.primary ?? '#ffffff'} />
              </TouchableOpacity>
              <Text style={[styles.title, { textAlign: 'left', paddingLeft: 16 }]}>Profile</Text>
            </View>
            <View style={styles.innerCard}>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>

                  <Image source={{ uri: selectedImageUri ?? user.profileImage }} style={styles.avatar} />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>First Name</Text>
              <Controller
                control={profileControl}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="First Name"
                    placeholderTextColor="rgba(255,255,255,0.75)"
                    keyboardType="default"
                    autoCapitalize="words"
                    value={value}
                    style={styles.input}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {profileErrors?.name && <Text style={styles.errorText}>{String(profileErrors.name.message)}</Text>}

              <Text style={styles.hint}>Last Name</Text>
              <Controller
                control={profileControl}
                name="surname"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Last Name"
                    placeholderTextColor="rgba(255,255,255,0.75)"
                    keyboardType="default"
                    autoCapitalize="words"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    style={styles.input}
                  />
                )}
              />
              {profileErrors?.surname && <Text style={styles.errorText}>{String(profileErrors.surname.message)}</Text>}

              <Text style={styles.hint}>Email</Text>
              <Controller
                control={profileControl}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor="rgba(255,255,255,0.75)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    style={styles.input}
                  />
                )}
              />
              {profileErrors?.email && <Text style={styles.errorText}>{String(profileErrors.email.message)}</Text>}

              <TouchableOpacity style={[styles.saveButton, { marginTop: 12 }]} onPress={handleProfileSubmit(onSaveProfile)}>
                <Text style={styles.saveButtonText}>Save profile</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </SafeAreaView>
      </ScrollView>
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
      width: '100%',
      paddingHorizontal: 24,
    },
    errorText: {
      color: '#ffb4b4',
      marginBottom: 8,
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
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
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
  });
};
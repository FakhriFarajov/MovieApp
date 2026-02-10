import useUserStore, { User } from '@/store/useUsers';
import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../api/AuthContext';
import { signUpSchema, SignUpSchemaType } from './sign-up.schema';

// Try to require DateTimePicker at runtime; fall back to null if not installed
let DateTimePicker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  DateTimePicker = null;
}

export default function RegisterScreen() {
  const router = useRouter();
  // form managed by react-hook-form
  const [agree, setAgree] = useState(false);
  const { users, addUser } = useUserStore();
  const { onRegister } = useAuth();
  const [showDobPicker, setShowDobPicker] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<SignUpSchemaType>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      dateOfBirth: "",
    },
  });

  async function handleRegister(values: SignUpSchemaType) {
    try {
      const emailLower = values.email.trim().toLowerCase();
      if (users.find(u => (u.email ?? '').toLowerCase() === emailLower)) {
        Alert.alert('Registration failed', 'An account with this email already exists');
        return;
      }

      // build payload that matches backend
      const payload = {
        name: values.name,
        surname: values.surname,
        email: values.email.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
        phoneNumber: values.phoneNumber ?? '',
        dateOfBirth: values.dateOfBirth ?? '',
      };

      // call backend register if available
      try {
        if (onRegister) {
          await onRegister(payload);
          Alert.alert('Registration successful', 'You can now log in');
          router.replace('/(tabs)/home');
        }
      } catch (e: any) {
        console.error("Registration error:", e);
        const msg = e?.msg || e?.response?.data || 'Registration failed';
        Alert.alert('Registration failed', String(msg));
        return;
      }

      const newUser: User = {
        name: values.name,
        surname: values.surname,
        email: values.email.trim(),
        password: values.password,
      };

      console.log('registering new user', newUser);
      addUser(newUser);
      await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));
      await AsyncStorage.setItem('users', JSON.stringify([...users, newUser]));
      router.replace('/(tabs)/home');
    } catch (error) {
      console.warn('register error', error);
      Alert.alert('Error', 'Could not create account, please try again');
    }
  }

  return (
    <ImageBackground
      source={require('@/assets/images/getting_started_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.6)"]} style={StyleSheet.absoluteFill} />

      <StatusBar barStyle="light-content" />

      <View style={styles.cardWrapper} pointerEvents="box-none">
        <BlurView intensity={35} tint="dark" style={styles.blurCard}>
          <View style={styles.innerCard}>
            <View style={styles.headerRow}>
              <Ionicons name="person-add" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.title}>Create account</Text>
            </View>

            <Text style={styles.hint}>Enter your details to create an account</Text>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput placeholder="Name" placeholderTextColor="rgba(255,255,255,0.75)" value={value} onChangeText={onChange} onBlur={onBlur} style={styles.input} />
                  {errors.name && <Text style={styles.errorText}>{String(errors.name.message)}</Text>}
                </>
              )}
            />

            <Controller
              control={control}
              name="surname"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput placeholder="Surname" placeholderTextColor="rgba(255,255,255,0.75)" value={value} onChangeText={onChange} onBlur={onBlur} style={styles.input} />
                  {errors.surname && <Text style={styles.errorText}>{String(errors.surname.message)}</Text>}
                </>
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput placeholder="Email" placeholderTextColor="rgba(255,255,255,0.75)" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} style={styles.input} />
                  {errors.email && <Text style={styles.errorText}>{String(errors.email.message)}</Text>}
                </>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput placeholder="Password" placeholderTextColor="rgba(255,255,255,0.75)" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} style={styles.input} />
                  {errors.password && <Text style={styles.errorText}>{String(errors.password.message)}</Text>}
                </>
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput placeholder="Confirm password" placeholderTextColor="rgba(255,255,255,0.75)" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} style={styles.input} />
                  {errors.confirmPassword && <Text style={styles.errorText}>{String(errors.confirmPassword.message)}</Text>}
                </>
              )}
            />

            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput placeholder="Phone number (optional)" placeholderTextColor="rgba(255,255,255,0.75)" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} style={styles.input} />
                  {errors.phoneNumber && <Text style={styles.errorText}>{String(errors.phoneNumber.message)}</Text>}
                </>
              )}
            />

            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity style={styles.input} onPress={() => setShowDobPicker(true)}>
                    <Text style={{ color: value ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                      {value ? String(value) : 'Date of birth (YYYY-MM-DD) (optional)'}
                    </Text>
                  </TouchableOpacity>
                  {showDobPicker && DateTimePicker ? (
                    <DateTimePicker
                      value={value ? new Date(value) : new Date(1990, 0, 1)}
                      mode="date"
                      display="default"
                      maximumDate={new Date()}
                      onChange={(event: any, selected?: Date | undefined) => {
                        setShowDobPicker(false);
                        if (selected) {
                          const iso = selected.toISOString().split('T')[0];
                          onChange(iso);
                        }
                      }}
                    />
                  ) : null}
                  {/* If DateTimePicker isn't installed, user can type the date string manually in the input above */}
                  {errors.dateOfBirth && <Text style={styles.errorText}>{String(errors.dateOfBirth.message)}</Text>}
                </>
              )}
            />

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgree(prev => !prev)}>
              <View style={[styles.checkbox, agree && styles.checkboxChecked]}>{agree && <Ionicons name="checkmark" size={14} color="#000" />}</View>
              <Text style={styles.checkboxText}>I agree to the Terms of Service</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.primaryButton, !agree && { opacity: 0.6 }]} onPress={handleSubmit(handleRegister)} disabled={!agree}>
              <Text style={styles.primaryButtonText}>Create account</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/pages/signin/auth')} style={styles.linkButton}>
              <Text style={styles.linkText}>Already have an account? Sign in</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
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
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  hint: {
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '100%' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#fff',
  },
  checkboxText: { color: 'rgba(255,255,255,0.9)' },
  primaryButton: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkButton: { marginTop: 12 },
  linkText: { color: 'rgba(255,255,255,0.9)' },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
  },
});

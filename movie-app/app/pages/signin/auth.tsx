import useUsersStore from '@/store/useUsers';
import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
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
import { signInSchema, SignInSchemaType } from './sign-in.schema';
import { useAuth } from '@/app/api/AuthContext';

export default function SignInScreen() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInSchemaType>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { onLogin } = useAuth();

  async function handleSignIn(values: SignInSchemaType) {
    try {
      await onLogin(values.email, values.password);
      router.replace('/(tabs)/home');
    } catch (e) {
      console.warn('signin error', e);
      Alert.alert('Error', 'Could not sign in, please try again');
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
        {/* Frosted glass card using BlurView. Install with: expo install expo-blur */}
        <BlurView intensity={35} tint="dark" style={styles.blurCard}>
          <View style={styles.innerCard}>
            <View style={styles.headerRow}>
              <Ionicons name="film" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.title}>Sign in</Text>
            </View>

            <Text style={styles.hint}>Welcome back — sign in to continue</Text>


            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="rgba(255,255,255,0.75)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  style={styles.input}
                />
              )}
            />

            {errors.email && <Text style={{ color: '#ff8080', alignSelf: 'flex-start', marginBottom: 8 }}>{errors.email.message}</Text>}

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.75)"
                  secureTextEntry
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  style={styles.input}
                />
              )}
            />

            {errors.password && <Text style={{ color: '#ff8080', alignSelf: 'flex-start', marginBottom: 8 }}>{errors.password.message}</Text>}

            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit(handleSignIn)}>
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/pages/signup/register')} style={styles.linkButton}>
              <Text style={styles.linkText}>Don't have an account? Register</Text>
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
    fontSize: 22,
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
  },
  linkText: {
    color: 'rgba(255,255,255,0.9)',
  },
});
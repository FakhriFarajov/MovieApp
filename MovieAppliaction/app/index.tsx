import { StyleSheet, View, Text, TouchableOpacity, ImageBackground, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure you have expo-linear-gradient installed
import IonIcon from '@expo/vector-icons/Ionicons';

export default function Index() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ImageBackground
                source={require('@/assets/images/getting_started_bg.png')}
                style={styles.background}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)', '#000000']}
                    style={styles.gradient}
                >
                    <View style={styles.content}>
                        {/* Logo */}
                        <Text style={styles.title}>FlickMovie</Text>
                        <Text style={styles.subtitle}>
                            Your personal cinema guide. Discover, track, and watch your next favorite story.
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => router.push('/register')} // Navigate to your main screen
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.buttonText}>Get Started</Text>
                                    <IonIcon name="chevron-forward" size={20} color="#fff" />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/auth')}>
                                <Text style={styles.secondaryButtonText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.footerText}>
                            By continuing, you agree to our Terms of Service.
                        </Text>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    background: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    gradient: {
        height: '70%',
        paddingHorizontal: 30,
        justifyContent: 'flex-end',
        paddingBottom: 50,
    },
    content: {
        alignItems: 'center',
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 20,
        borderRadius: 18,
    },
    title: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 10,
    },
    subtitle: {
        color: '#D1D1D1',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    buttonContainer: {
        width: '100%',
        gap: 15,
    },
    primaryButton: {
        backgroundColor: '#007AFF', // Matches your logo's blue
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    secondaryButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '500',
    },
    footerText: {
        color: '#666',
        fontSize: 12,
        marginTop: 30,
    },
});
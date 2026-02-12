import { useRouter } from 'expo-router';
import { Clapperboard, Settings } from 'lucide-react-native';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SIDEBAR_WIDTH = 280;

type SidebarContextValue = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue>({
    isOpen: false,
    open: () => { },
    close: () => { },
    toggle: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateX, { toValue: isOpen ? 0 : -SIDEBAR_WIDTH, duration: 220, useNativeDriver: true }),
            Animated.timing(backdropOpacity, { toValue: isOpen ? 0.5 : 0, duration: 220, useNativeDriver: true }),
        ]).start();
    }, [isOpen, translateX, backdropOpacity]);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen((v) => !v);

    const navigate = (path: string) => {
        close();
        // small delay so animation can start
        setTimeout(() => router.push(path as any), 240);
    };

    return (
        <SidebarContext.Provider value={{ isOpen, open, close, toggle }}>
            {children}
            {/* Backdrop */}
            <Animated.View pointerEvents={isOpen ? 'auto' : 'none'} style={[styles.backdrop, { opacity: backdropOpacity }]}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} />
            </Animated.View>

            {/* Sidebar panel */}
            <Animated.View style={[styles.sidebar, { transform: [{ translateX }] }]}>
                <Text style={styles.title}>MovieApp</Text>
                <TouchableOpacity onPress={() => navigate('/theatres')} style={styles.link}>
                    <Clapperboard color="#fff" size={24} />
                    <Text style={styles.linkText}>Nearby Theatres</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigate('/settings')} style={styles.link}>
                    <Settings color="#fff" size={24} />
                    <Text style={styles.linkText}>Settings</Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }} />
                <Text style={styles.footer}>v1.0 All rights are reserved</Text>
            </Animated.View>
        </SidebarContext.Provider>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
    },
    sidebar: {
        padding: '15%',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        paddingHorizontal: 16,
        backgroundColor: '#211422fd',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 3, height: 0 },
        shadowRadius: 6,
        elevation: 8,
    },
    title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 },
    link: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
    linkText: { color: '#fff', fontSize: 16, marginLeft: 12 },
    footer: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 12 },
});
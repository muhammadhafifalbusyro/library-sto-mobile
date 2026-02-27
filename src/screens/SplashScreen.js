import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Animated,
    Dimensions,
    StatusBar
} from 'react-native';
import { BookOpen } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#165DFF',
    white: '#FFFFFF',
    textMain: '#1e293b',
    textSub: '#64748b',
    splashBg: '#FFFFFF',
};

const SplashScreen = ({ onFinish }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
        ]).start();

        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                if (onFinish) onFinish();
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [fadeAnim, scaleAnim, onFinish]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.splashBg} />
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}
            >
                <View style={styles.logoCircle}>
                    <View style={styles.logoPulse}>
                        <BookOpen size={60} color={COLORS.primary} strokeWidth={2.5} />
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.appName}>Library STO</Text>
                    <Text style={styles.appTagline}>Digital Inventory Solution</Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2024 • Powered by STO Team</Text>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.splashBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.primary + '1A', // Soft blue tint matching Login
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    logoPulse: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        alignItems: 'center',
    },
    appName: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.textMain,
        letterSpacing: 0.5,
    },
    appTagline: {
        fontSize: 12,
        color: COLORS.textSub,
        marginTop: 8,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    footer: {
        position: 'absolute',
        bottom: -width * 0.5,
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.textSub,
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.6,
    },
});

export default SplashScreen;

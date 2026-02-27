import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
} from 'react-native';
import {
    BookOpen,
    User,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    HelpCircle,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const COLORS = {
    primary: '#165DFF',
    primaryHover: '#0E4BD9',
    foreground: '#080C1A',
    secondary: '#6A7686',
    muted: '#EFF2F7',
    border: '#F3F4F3',
    cardGrey: '#F1F3F6',
};

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Peringatan', 'Harap isi alamat email dan kata sandi Anda.');
            return;
        }

        setLoading(true);
        try {
            console.log('Attempting login to:', apiClient.defaults.baseURL);
            const response = await apiClient.post('/auth/login', {
                email,
                password,
            });

            if (response.data && response.data.access_token) {
                const { access_token, user } = response.data;
                await AsyncStorage.setItem('token', access_token);
                await AsyncStorage.setItem('user', JSON.stringify(user));
                navigation.replace('Main', { user });
            } else {
                throw new Error('Format respon server tidak valid');
            }
        } catch (error) {
            console.error('LOGIN ERROR:', error);
            let errorMessage = 'Terjadi kesalahan sistem. Silakan coba lagi.';

            if (error.response) {
                // Server responded with error status
                console.log('Error Data:', error.response.data);
                errorMessage = error.response.data?.error || error.response.data?.message || 'Email atau password salah.';
            } else if (error.request) {
                // Request made but no response
                errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda atau Base URL API.';
            } else {
                errorMessage = error.message;
            }

            Alert.alert('Login Gagal', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Top Navbar */}
            <View style={styles.navbar}>
                <Text style={styles.navbarTitle}>Masuk Akun</Text>
                <TouchableOpacity
                    style={styles.helpButton}
                    onPress={() => Alert.alert('Bantuan', 'Silakan hubungi administrator jika Anda kesulitan masuk ke akun Anda.')}
                >
                    <HelpCircle size={20} color={COLORS.secondary} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <View style={styles.logoCircle}>
                            <View style={styles.logoPulse}>
                                <BookOpen size={40} color={COLORS.primary} strokeWidth={2} />
                            </View>
                        </View>
                        <Text style={styles.heroTitle}>Selamat Datang</Text>
                        <Text style={styles.heroSubtitle}>
                            Silakan masuk untuk memulai kegiatan stok opname perpustakaan.
                        </Text>
                    </View>

                    {/* Login Form Section */}
                    <View style={styles.formSection}>
                        {/* Email Input */}
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>ALAMAT EMAIL</Text>
                            <View style={styles.inputContainer}>
                                <View style={styles.iconBox}>
                                    <User size={18} color={COLORS.secondary} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Masukkan email Anda"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputWrapper}>
                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>KATA SANDI</Text>
                            </View>
                            <View style={styles.inputContainer}>
                                <View style={styles.iconBox}>
                                    <Lock size={18} color={COLORS.secondary} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity
                                    style={styles.toggleButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                    activeOpacity={0.6}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color={COLORS.secondary} />
                                    ) : (
                                        <Eye size={20} color={COLORS.secondary} />
                                    )}
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>Lupa kata sandi?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>Masuk Aplikasi</Text>
                                    <ArrowRight size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>© 2024 Library STO Team</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    navbar: {
        height: 76,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    navbarTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.foreground,
    },
    helpButton: {
        position: 'absolute',
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.primary + '1A', // 10% opacity
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    logoPulse: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.foreground,
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        color: COLORS.secondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    formSection: {
        marginBottom: 32,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.secondary,
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 20,
        height: 56,
        paddingHorizontal: 12,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.muted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.foreground,
        height: '100%',
    },
    toggleButton: {
        padding: 4,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    forgotPasswordText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.secondary,
        opacity: 0.6,
    },
});

export default LoginScreen;

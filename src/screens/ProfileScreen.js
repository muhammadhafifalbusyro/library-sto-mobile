import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogOut, User, Mail, ShieldCheck } from 'lucide-react-native';
import apiClient from '../api/client';

const ProfileScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);

    useFocusEffect(
        useCallback(() => {
            const loadUser = async () => {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    setUser(JSON.parse(userData));
                }
            };
            loadUser();
        }, [])
    );

    const handleLogout = async () => {
        Alert.alert(
            'Konfirmasi Logout',
            'Apakah Anda yakin ingin keluar?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Ya, Keluar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Call API logout (optional focus on local cleanup)
                            await apiClient.post('/auth/logout').catch(() => { });

                            await AsyncStorage.removeItem('token');
                            await AsyncStorage.removeItem('user');

                            navigation.replace('Login');
                        } catch (error) {
                            console.error(error);
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=4f46e5&color=fff&size=128` }}
                        style={styles.avatar}
                    />
                </View>
                <Text style={styles.userName}>{user?.name || 'Loading...'}</Text>
                <Text style={styles.userRole}>Staff Perpustakaan</Text>
            </View>

            <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                    <View style={styles.iconCircle}>
                        <Mail size={20} color="#4f46e5" />
                    </View>
                    <View>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user?.email || '-'}</Text>
                    </View>
                </View>

                <View style={styles.infoItem}>
                    <View style={styles.iconCircle}>
                        <ShieldCheck size={20} color="#4f46e5" />
                    </View>
                    <View>
                        <Text style={styles.infoLabel}>Role</Text>
                        <Text style={styles.infoValue}>{user?.role === 'admin' ? 'Administrator' : 'Staff'}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut size={20} color="#ef4444" />
                <Text style={styles.logoutBtnText}>Keluar dari Akun</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Versi 1.0.0 (Build 20260218)</Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginVertical: 32,
    },
    avatarContainer: {
        padding: 4,
        borderRadius: 36,
        backgroundColor: '#fff',
        shadowColor: '#4f46e5',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 32,
    },
    userName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1e293b',
    },
    userRole: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    infoSection: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f0f0ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '700',
        marginTop: 2,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fee2e2',
        padding: 16,
        borderRadius: 16,
        gap: 10,
    },
    logoutBtnText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '700',
    },
    versionText: {
        textAlign: 'center',
        marginTop: 'auto',
        color: '#94a3b8',
        fontSize: 12,
    },
});

export default ProfileScreen;

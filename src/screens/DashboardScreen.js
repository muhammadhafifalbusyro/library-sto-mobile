import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    SafeAreaView,
    Image,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { Book, CheckCircle, Users, Award, Wallet, Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const COLORS = {
    primary: '#165DFF',
    white: '#FFFFFF',
    background: '#F8FAFC',
    textMain: '#1e293b',
    textSub: '#64748b',
};

const DashboardScreen = () => {
    const [user, setUser] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
    };

    const fetchDashboardData = async () => {
        try {
            const response = await apiClient.get('/dashboard');
            setData(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadUser();
            fetchDashboardData();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
    }, []);

    const formatRupiah = (number) => {
        if (number === undefined || number === null) return 'Rp 0';
        return 'Rp ' + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const { stats, leaderboard } = data || {};

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            {/* Blue Header */}
            <View style={styles.headerContainer}>
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.greetingText}>Selamat Datang,</Text>
                            <Text style={styles.userNameText}>{user?.name || 'Pustakawan'}</Text>
                        </View>
                        <TouchableOpacity style={styles.notificationBtn}>
                            <Bell size={24} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#e0e7ff' }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#4f46e5' }]}>
                            <Book size={20} color="#fff" />
                        </View>
                        <Text style={styles.statValue}>{stats?.total_books || 0}</Text>
                        <Text style={styles.statLabel}>Judul Buku</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#f1f5f9' }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#64748b' }]}>
                            <Users size={20} color="#fff" />
                        </View>
                        <Text style={styles.statValue}>{stats?.total_items || 0}</Text>
                        <Text style={styles.statLabel}>Total Buku</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#dcfce7', marginTop: 12 }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#22c55e' }]}>
                            <CheckCircle size={20} color="#fff" />
                        </View>
                        <Text style={styles.statValue}>{stats?.verified_books || 0}</Text>
                        <Text style={styles.statLabel}>Verified System</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#ffedd5', marginTop: 12 }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#f97316' }]}>
                            <Award size={20} color="#fff" />
                        </View>
                        <Text style={styles.statValue}>{stats?.user_verified || 0}</Text>
                        <Text style={styles.statLabel}>Your STO</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#fef3c7', marginTop: 12, width: '100%' }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#f59e0b' }]}>
                            <Wallet size={20} color="#fff" />
                        </View>
                        <Text style={[styles.statValue, { fontSize: 24 }]}>{formatRupiah(stats?.user_commission || 0)}</Text>
                        <Text style={styles.statLabel}>Your Commission Earned</Text>
                    </View>
                </View>

                {/* Leaderboard Section */}
                <View style={styles.sectionHeader}>
                    <Users size={20} color="#334155" />
                    <Text style={styles.sectionTitle}>Papan Peringkat</Text>
                </View>

                {leaderboard?.map((item, index) => {
                    const isTop3 = index < 3;
                    const rankColors = ['#f59e0b', '#94a3b8', '#b45309'];
                    const initial = item.name ? item.name.charAt(0).toUpperCase() : '?';

                    return (
                        <View key={index} style={styles.leaderboardItem}>
                            <View style={[
                                styles.rankBadge,
                                isTop3 && { backgroundColor: rankColors[index] + '20' }
                            ]}>
                                <Text style={[
                                    styles.rankText,
                                    isTop3 && { color: rankColors[index], fontSize: 16 }
                                ]}>
                                    {index + 1}
                                </Text>
                            </View>

                            {/* Avatar Container with Initials Fallback */}
                            <View style={[styles.avatarContainer, { backgroundColor: `hsl(${(index * 137) % 360}, 70%, 90%)` }]}>
                                <Text style={[styles.avatarInitial, { color: `hsl(${(index * 137) % 360}, 70%, 40%)` }]}>
                                    {initial}
                                </Text>
                                <Image
                                    source={{ uri: item.avatar_url }}
                                    style={styles.avatarImage}
                                />
                            </View>

                            <View style={styles.userInfo}>
                                <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.userCount}>{item.count} Books</Text>
                            </View>

                            {index === 0 && <Award size={20} color="#f59e0b" fill="#f59e0b20" />}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 30,
    },
    greetingText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '500',
    },
    userNameText: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: '800',
        marginTop: 2,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentScroll: {
        marginTop: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 20,
        alignItems: 'flex-start',
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    iconBox: {
        padding: 10,
        borderRadius: 12,
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.textMain,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSub,
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textMain,
        marginLeft: 10,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
    },
    rankText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#64748b',
    },
    avatarContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        marginHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: '700',
    },
    avatarImage: {
        ...StyleSheet.absoluteFillObject,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textMain,
    },
    userCount: {
        fontSize: 13,
        color: COLORS.textSub,
        marginTop: 2,
    },
});

export default DashboardScreen;

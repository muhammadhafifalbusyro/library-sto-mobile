import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Image,
    ScrollView,
    Modal,
} from 'react-native';
import {
    Search, Plus, Trash2, BookOpen, Users,
    PieChart, Trophy, X,
    ChevronRight, Check, Settings2, Coins
} from 'lucide-react-native';
import apiClient from '../api/client';

const COLORS = {
    primary: '#165DFF',
    white: '#FFFFFF',
    background: '#F8FAFC',
    textMain: '#1e293b',
    textSub: '#64748b',
    border: '#E2E8F0',
    green: '#22c55e',
};

const ManagementScreen = () => {
    const [activeTab, setActiveTab] = useState('Dashboard'); // 'Dashboard', 'Buku', 'User', 'Komisi'
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState('');
    const [data, setData] = useState({
        stats: null,
        books: [],
        users: [],
        settings: null,
        pagination: { current_page: 1, last_page: 1 }
    });

    // Modal States
    const [bookModalVisible, setBookModalVisible] = useState(false);
    const [userModalVisible, setUserModalVisible] = useState(false);
    const [commissionModalVisible, setCommissionModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    // Form States
    const [bookForm, setBookForm] = useState({
        title: '', author: '', publisher: '', place_of_publication: '',
        year_of_publication: '', isbn_issn: '', item_code: '', language: '', collation: '',
        gmd_type: '', classification: '', call_number: '', subject: '',
        abstract: '', cover_image: '', total_items: '', edition: '',
        frequency_of_publication: '', series_title: '', attachment: '',
        is_featured: false
    });
    const [userForm, setUserForm] = useState({
        name: '', email: '', role: 'staff', password: ''
    });
    const [commissionValue, setCommissionValue] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async (page = 1, isRefresh = true) => {
        if (isRefresh) setLoading(true);
        else setLoadingMore(true);

        try {
            if (activeTab === 'Dashboard' || activeTab === 'Komisi') {
                const res = await apiClient.get('/admin/stats');
                setData(prev => ({ ...prev, stats: res.data }));

                if (activeTab === 'Komisi') {
                    const settingsRes = await apiClient.get('/admin/settings');
                    setData(prev => ({ ...prev, settings: settingsRes.data }));
                    setCommissionValue(settingsRes.data.commission.toString());
                }
            } else if (activeTab === 'Buku') {
                const res = await apiClient.get(`/admin/books?page=${page}&search=${search}`);
                const newData = res.data.data || [];
                setData(prev => {
                    const combined = isRefresh ? newData : [...prev.books, ...newData];
                    // Ensure unique IDs
                    const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
                    return {
                        ...prev,
                        books: unique,
                        pagination: { current_page: res.data.current_page, last_page: res.data.last_page }
                    };
                });
            } else if (activeTab === 'User') {
                const res = await apiClient.get(`/admin/users?page=${page}&search=${search}`);
                const newData = res.data.data || [];
                setData(prev => {
                    const combined = isRefresh ? newData : [...prev.users, ...newData];
                    // Ensure unique IDs
                    const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
                    return {
                        ...prev,
                        users: unique,
                        pagination: { current_page: res.data.current_page, last_page: res.data.last_page }
                    };
                });
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Gagal memuat data');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeTab, search]);

    useEffect(() => {
        fetchData(1, true);
    }, [fetchData]);

    const handleLoadMore = () => {
        if (!loading && !loadingMore && data.pagination.current_page < data.pagination.last_page) {
            fetchData(data.pagination.current_page + 1, false);
        }
    };

    const formatRupiah = (number) => {
        if (number === undefined || number === null) return 'Rp 0';
        return 'Rp ' + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleDelete = (id, title, type) => {
        Alert.alert(
            'Konfirmasi Hapus',
            `Hapus ${title}?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus', style: 'destructive',
                    onPress: async () => {
                        try {
                            const endpoint = type === 'Buku' ? `/admin/books/${id}` : `/admin/users/${id}`;
                            await apiClient.delete(endpoint);
                            fetchData(1, true);
                        } catch (error) {
                            Alert.alert('Error', 'Gagal menghapus');
                        }
                    }
                }
            ]
        );
    };

    const openBookModal = (item = null) => {
        if (item) {
            setIsEditing(true);
            setCurrentId(item.id);
            setBookForm({
                title: item.title || '',
                author: item.author || '',
                publisher: item.publisher || '',
                place_of_publication: item.place_of_publication || '',
                year_of_publication: item.year_of_publication?.toString() || '',
                isbn_issn: item.isbn_issn || '',
                item_code: item.item_code || '',
                language: item.language || '',
                collation: item.collation || '',
                gmd_type: item.gmd_type || '',
                classification: item.classification || '',
                call_number: item.call_number || '',
                subject: item.subject || '',
                abstract: item.abstract || '',
                cover_image: item.cover_image || '',
                total_items: item.total_items?.toString() || '',
                edition: item.edition || '',
                frequency_of_publication: item.frequency_of_publication || '',
                series_title: item.series_title || '',
                attachment: item.attachment || '',
                is_featured: !!item.is_featured
            });
        } else {
            setIsEditing(false);
            setCurrentId(null);
            setBookForm({
                title: '', author: '', publisher: '', place_of_publication: '',
                year_of_publication: '', isbn_issn: '', item_code: '', language: '', collation: '',
                gmd_type: '', classification: '', call_number: '', subject: '',
                abstract: '', cover_image: '', total_items: '', edition: '',
                frequency_of_publication: '', series_title: '', attachment: '',
                is_featured: false
            });
        }
        setBookModalVisible(true);
    };

    const openUserModal = (item = null) => {
        if (item) {
            setIsEditing(true);
            setCurrentId(item.id);
            setUserForm({
                name: item.name || '',
                email: item.email || '',
                role: item.role || 'staff',
                password: ''
            });
        } else {
            setIsEditing(false);
            setCurrentId(null);
            setUserForm({ name: '', email: '', role: 'staff', password: '' });
        }
        setUserModalVisible(true);
    };

    const handleCreateOrUpdateBook = async () => {
        if (!bookForm.title || !bookForm.author || !bookForm.publisher || !bookForm.place_of_publication || !bookForm.year_of_publication) {
            Alert.alert('Eror', 'Field bertanda * wajib diisi');
            return;
        }
        setSubmitting(true);
        try {
            if (isEditing) {
                await apiClient.put(`/admin/books/${currentId}`, bookForm);
            } else {
                await apiClient.post('/admin/books', bookForm);
            }
            setBookModalVisible(false);
            fetchData(1, true);
        } catch (error) {
            Alert.alert('Error', `Gagal ${isEditing ? 'mengupdate' : 'menambah'} buku`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateOrUpdateUser = async () => {
        if (!userForm.name || !userForm.email || (!isEditing && !userForm.password)) {
            Alert.alert('Eror', 'Nama, Email, dan Password wajib diisi');
            return;
        }
        setSubmitting(true);
        try {
            const payload = { ...userForm };
            if (isEditing && !payload.password) delete payload.password;

            if (isEditing) {
                await apiClient.put(`/admin/users/${currentId}`, payload);
            } else {
                await apiClient.post('/admin/users', payload);
            }
            setUserModalVisible(false);
            fetchData(1, true);
        } catch (error) {
            Alert.alert('Error', `Gagal ${isEditing ? 'mengupdate' : 'menambah'} user`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateCommission = async () => {
        const rawValue = commissionValue.replace(/\./g, '');
        if (!rawValue) return;
        setSubmitting(true);
        try {
            await apiClient.post('/admin/settings', { commission: rawValue });
            Alert.alert('Sukses', 'Setting komisi berhasil disimpan');
            setCommissionModalVisible(false);
            fetchData(1, true);
        } catch (error) {
            Alert.alert('Error', 'Gagal menyimpan setting komisi');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Sub-components (Renderers) ---

    const renderDashboard = () => {
        const { overview, conditions, contributors } = data.stats || {};
        return (
            <ScrollView contentContainerStyle={styles.dashboardScroll} showsVerticalScrollIndicator={false}>
                {/* Overview Stats Grid matching Web */}
                <View style={[styles.gridContainer, { flexWrap: 'wrap' }]}>
                    <View style={[styles.miniStat, { backgroundColor: '#165DFF', minWidth: '31%' }]}>
                        <Text style={styles.miniStatVal}>{overview?.total_books || 0}</Text>
                        <Text style={styles.miniStatLabel}>Total Buku</Text>
                    </View>
                    <View style={[styles.miniStat, { backgroundColor: '#22c55e', minWidth: '31%' }]}>
                        <Text style={styles.miniStatVal}>{overview?.verified || 0}</Text>
                        <Text style={styles.miniStatLabel}>Verifikasi</Text>
                    </View>
                    <View style={[styles.miniStat, { backgroundColor: '#64748b', minWidth: '31%' }]}>
                        <Text style={styles.miniStatVal}>{overview?.progress_percentage || 0}%</Text>
                        <Text style={styles.miniStatLabel}>Progress</Text>
                    </View>
                    <View style={[styles.miniStat, { backgroundColor: '#ef4444', minWidth: '31%' }]}>
                        <Text style={styles.miniStatVal}>{conditions?.reduce((acc, curr) => curr.condition !== 'Baik' ? acc + curr.total : acc, 0)}</Text>
                        <Text style={styles.miniStatLabel}>Issues</Text>
                    </View>
                    <View style={[styles.miniStat, { backgroundColor: '#f59e0b', minWidth: '31%' }]}>
                        <Text style={styles.miniStatVal}>{formatRupiah(overview?.total_commission || 0)}</Text>
                        <Text style={styles.miniStatLabel}>Total Komisi</Text>
                    </View>
                    <View style={[styles.miniStat, { backgroundColor: '#6366f1', minWidth: '31%' }]}>
                        <Text style={styles.miniStatVal}>{formatRupiah(overview?.current_commission || 0)}</Text>
                        <Text style={styles.miniStatLabel}>Per STO</Text>
                    </View>
                </View>

                {/* Condition Section */}
                <View style={styles.sectionHeader}>
                    <PieChart size={20} color="#1e293b" />
                    <Text style={styles.sectionTitle}>Kondisi Buku</Text>
                </View>
                <View style={styles.conditionCard}>
                    {conditions?.map((c, i) => (
                        <View key={i} style={styles.conditionItem}>
                            <Text style={styles.conditionLabel}>{c.condition}</Text>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${overview?.verified > 0 ? (c.total / overview.verified) * 100 : 0}%` }]} />
                            </View>
                            <Text style={styles.conditionCount}>{c.total} Buku</Text>
                        </View>
                    ))}
                    {(!conditions || conditions.length === 0) && <Text style={styles.emptyText}>Belum ada data kondisi.</Text>}
                </View>

                {/* Top Contributors */}
                <View style={styles.sectionHeader}>
                    <Trophy size={20} color="#1e293b" />
                    <Text style={styles.sectionTitle}>Top Kontributor</Text>
                </View>
                {contributors?.map((u, i) => (
                    <View key={i} style={styles.contributorItem}>
                        <Text style={styles.rankText}>#{i + 1}</Text>
                        <View style={[styles.avatarMini, { backgroundColor: `hsl(${(i * 137) % 360}, 70%, 90%)` }]}>
                            <Text style={[styles.avatarInitialSmall, { color: `hsl(${(i * 137) % 360}, 70%, 40%)` }]}>
                                {u.name?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.contributorName}>{u.name}</Text>
                            <Text style={styles.contributorRole}>{u.role}</Text>
                        </View>
                        <Text style={styles.contributorVal}>{u.stock_opnames_count || 0}</Text>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderKomisi = () => {
        const { contributors, overview } = data.stats || {};
        return (
            <ScrollView contentContainerStyle={styles.dashboardScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.commissionHeaderCard}>
                    <View style={styles.iconCircleLarge}>
                        <Coins size={40} color={COLORS.primary} />
                    </View>
                    <Text style={styles.commissionLabelBold}>Setting Komisi Per Buku</Text>
                    <Text style={styles.commissionValueLarge}>{formatRupiah(overview?.current_commission || 0)}</Text>
                    <TouchableOpacity
                        style={styles.adjustBtn}
                        onPress={() => setCommissionModalVisible(true)}
                    >
                        <Settings2 size={16} color="#fff" />
                        <Text style={styles.adjustBtnText}>Ubah Minimal Komisi</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionHeader}>
                    <Trophy size={20} color="#1e293b" />
                    <Text style={styles.sectionTitle}>Akumulasi Komisi User</Text>
                </View>
                {[...contributors || []].sort((a, b) => b.total_commission - a.total_commission).map((u, i) => (
                    <View key={i} style={styles.contributorItem}>
                        <View style={[styles.rankBadge, { backgroundColor: i < 3 ? '#FEF3C7' : '#f1f5f9' }]}>
                            <Text style={[styles.rankText, { color: i < 3 ? '#D97706' : '#94a3b8' }]}>{i + 1}</Text>
                        </View>
                        <View style={[styles.avatarMini, { backgroundColor: `hsl(${(i * 137) % 360}, 70%, 90%)` }]}>
                            <Text style={[styles.avatarInitialSmall, { color: `hsl(${(i * 137) % 360}, 70%, 40%)` }]}>
                                {u.name?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.contributorName}>{u.name}</Text>
                            <Text style={styles.contributorRole}>{u.email}</Text>
                        </View>
                        <Text style={[styles.contributorVal, { color: '#D97706' }]}>
                            {formatRupiah(u.total_commission || 0)}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderBookItem = ({ item }) => (
        <View style={styles.listItem}>
            <View style={styles.bookIconBox}>
                <BookOpen size={20} color="#165DFF" />
            </View>
            <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{item.author || '-'} • {item.isbn_issn || 'N/A'}</Text>
            </View>
            <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => openBookModal(item)} style={styles.editBtn}>
                    <ChevronRight size={18} color="#165DFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.title, 'Buku')} style={styles.deleteBtn}>
                    <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderUserItem = ({ item }) => (
        <View style={styles.listItem}>
            <View style={[styles.userAvatar, { backgroundColor: `hsl(${(item.id * 137) % 360}, 70%, 90%)`, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: `hsl(${(item.id * 137) % 360}, 70%, 40%)` }}>
                    {item.name?.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemSubtitle}>{item.email} • {item.role}</Text>
            </View>
            <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => openUserModal(item)} style={styles.editBtn}>
                    <ChevronRight size={18} color="#165DFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name, 'User')} style={styles.deleteBtn}>
                    <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header & Manual Top Tabs */}
            <View style={styles.headerCard}>
                <View style={styles.tabContainer}>
                    {['Dashboard', 'Buku', 'User', 'Komisi'].map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => { setActiveTab(tab); setSearch(''); }}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {activeTab !== 'Dashboard' && activeTab !== 'Komisi' && (
                    <View style={styles.searchBar}>
                        <Search size={18} color="#94a3b8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={`Cari ${activeTab.toLowerCase()}...`}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                )}
            </View>

            {/* Main Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#165DFF" />
                </View>
            ) : activeTab === 'Dashboard' ? (
                renderDashboard()
            ) : activeTab === 'Komisi' ? (
                renderKomisi()
            ) : (
                <FlatList
                    data={activeTab === 'Buku' ? data.books : data.users}
                    renderItem={activeTab === 'Buku' ? renderBookItem : renderUserItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={() => loadingMore ? (
                        <View style={{ padding: 20 }}>
                            <ActivityIndicator color={COLORS.primary} />
                        </View>
                    ) : null}
                />
            )}

            {/* Floating Action Button */}
            {activeTab !== 'Dashboard' && activeTab !== 'Komisi' && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => activeTab === 'Buku' ? openBookModal() : openUserModal()}
                >
                    <Plus size={30} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Modal Tambah/Edit Buku */}
            <Modal visible={bookModalVisible} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderLeft}>
                            <View style={[styles.modalIconBox, { backgroundColor: '#eef2ff' }]}>
                                <BookOpen size={20} color="#165DFF" />
                            </View>
                            <Text style={styles.modalTitle}>{isEditing ? 'Edit Buku' : 'Tambah Buku'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setBookModalVisible(false)}>
                            <X size={24} color="#1e293b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                        {/* Section: Informasi Utama */}
                        <View style={styles.formSection}>
                            <View style={styles.sectionTitleRow}>
                                <Text style={styles.formSectionTitle}>Informasi Utama</Text>
                            </View>

                            <Text style={styles.label}>Judul Buku <Text style={styles.required}>*</Text></Text>
                            <TextInput style={styles.input} placeholder="Masukkan judul" value={bookForm.title} onChangeText={v => setBookForm({ ...bookForm, title: v })} />

                            <Text style={styles.label}>Pengarang <Text style={styles.required}>*</Text></Text>
                            <TextInput style={styles.input} placeholder="Masukkan pengarang" value={bookForm.author} onChangeText={v => setBookForm({ ...bookForm, author: v })} />

                            <Text style={styles.label}>Penerbit <Text style={styles.required}>*</Text></Text>
                            <TextInput style={styles.input} placeholder="Penerbit" value={bookForm.publisher} onChangeText={v => setBookForm({ ...bookForm, publisher: v })} />

                            <View style={styles.row}>
                                <View style={{ flex: 1.5 }}>
                                    <Text style={styles.label}>Tempat Terbit <Text style={styles.required}>*</Text></Text>
                                    <TextInput style={styles.input} placeholder="Jakarta" value={bookForm.place_of_publication} onChangeText={v => setBookForm({ ...bookForm, place_of_publication: v })} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Thn Terbit <Text style={styles.required}>*</Text></Text>
                                    <TextInput style={styles.input} placeholder="2026" maxLength={4} keyboardType="numeric" value={bookForm.year_of_publication} onChangeText={v => setBookForm({ ...bookForm, year_of_publication: v })} />
                                </View>
                            </View>
                        </View>

                        {/* Section: Identifikasi */}
                        <View style={styles.formSection}>
                            <View style={styles.sectionTitleRow}>
                                <Text style={styles.formSectionTitle}>Identifikasi</Text>
                            </View>

                            <Text style={styles.label}>ISBN / ISSN</Text>
                            <TextInput style={styles.input} placeholder="978..." value={bookForm.isbn_issn} onChangeText={v => setBookForm({ ...bookForm, isbn_issn: v })} />

                            <Text style={styles.label}>Item Code</Text>
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                placeholder="P001, P002 (pisahkan dengan koma)"
                                multiline
                                value={bookForm.item_code}
                                onChangeText={v => setBookForm({ ...bookForm, item_code: v })}
                            />

                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Klasifikasi</Text>
                                    <TextInput style={styles.input} placeholder="813.01" value={bookForm.classification} onChangeText={v => setBookForm({ ...bookForm, classification: v })} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Nomor Panggil</Text>
                                    <TextInput style={styles.input} placeholder="PNP 01" value={bookForm.call_number} onChangeText={v => setBookForm({ ...bookForm, call_number: v })} />
                                </View>
                            </View>

                            <Text style={styles.label}>Tajuk Subjek</Text>
                            <TextInput style={styles.input} placeholder="Kesusastraan Indonesia" value={bookForm.subject} onChangeText={v => setBookForm({ ...bookForm, subject: v })} />
                        </View>

                        {/* Section: Detail Tambahan */}
                        <View style={styles.formSection}>
                            <View style={styles.sectionTitleRow}>
                                <Text style={styles.formSectionTitle}>Detail Tambahan</Text>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Bahasa</Text>
                                    <TextInput style={styles.input} placeholder="Indonesia" value={bookForm.language} onChangeText={v => setBookForm({ ...bookForm, language: v })} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Edisi</Text>
                                    <TextInput style={styles.input} placeholder="Cetakan ke-1" value={bookForm.edition} onChangeText={v => setBookForm({ ...bookForm, edition: v })} />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>GMD / Jenis</Text>
                                    <TextInput style={styles.input} placeholder="Teks" value={bookForm.gmd_type} onChangeText={v => setBookForm({ ...bookForm, gmd_type: v })} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Eksemplar</Text>
                                    <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={bookForm.total_items} onChangeText={v => setBookForm({ ...bookForm, total_items: v })} />
                                </View>
                            </View>

                            <Text style={styles.label}>Kolasi</Text>
                            <TextInput style={styles.input} placeholder="xii, 200 hlm; 21 cm" value={bookForm.collation} onChangeText={v => setBookForm({ ...bookForm, collation: v })} />

                            <Text style={styles.label}>Kala Terbit</Text>
                            <TextInput style={styles.input} placeholder="Mingguan" value={bookForm.frequency_of_publication} onChangeText={v => setBookForm({ ...bookForm, frequency_of_publication: v })} />

                            <Text style={styles.label}>Judul Seri</Text>
                            <TextInput style={styles.input} placeholder="Seri Fantasi" value={bookForm.series_title} onChangeText={v => setBookForm({ ...bookForm, series_title: v })} />
                        </View>

                        {/* Section: Konten & Media */}
                        <View style={styles.formSection}>
                            <View style={styles.sectionTitleRow}>
                                <Text style={styles.formSectionTitle}>Konten & Media</Text>
                            </View>

                            <Text style={styles.label}>Abstrak</Text>
                            <TextInput
                                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                placeholder="Deskripsi singkat buku..."
                                multiline
                                value={bookForm.abstract}
                                onChangeText={v => setBookForm({ ...bookForm, abstract: v })}
                            />

                            <Text style={styles.label}>Gambar Sampul (URL)</Text>
                            <TextInput style={styles.input} placeholder="https://..." value={bookForm.cover_image} onChangeText={v => setBookForm({ ...bookForm, cover_image: v })} />

                            <Text style={styles.label}>Lampiran (URL)</Text>
                            <TextInput style={styles.input} placeholder="https://..." value={bookForm.attachment} onChangeText={v => setBookForm({ ...bookForm, attachment: v })} />

                            <View style={styles.checkboxRow}>
                                <TouchableOpacity
                                    style={[styles.checkbox, bookForm.is_featured && styles.checkboxActive]}
                                    onPress={() => setBookForm({ ...bookForm, is_featured: !bookForm.is_featured })}
                                >
                                    {bookForm.is_featured && <Check size={14} color="#fff" />}
                                </TouchableOpacity>
                                <Text style={styles.checkboxLabel}>Buku Unggulan</Text>
                            </View>
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.submitBtn} onPress={handleCreateOrUpdateBook} disabled={submitting}>
                            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isEditing ? 'Update Buku' : 'Simpan Buku'}</Text>}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Modal Tambah/Edit User */}
            <Modal visible={userModalVisible} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderLeft}>
                            <View style={[styles.modalIconBox, { backgroundColor: '#f0fdf4' }]}>
                                <Users size={20} color="#16a34a" />
                            </View>
                            <Text style={styles.modalTitle}>{isEditing ? 'Edit User' : 'Tambah User'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                            <X size={24} color="#1e293b" />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.modalForm, { padding: 24 }]}>
                        <Text style={styles.label}>Nama Lengkap <Text style={styles.required}>*</Text></Text>
                        <TextInput style={styles.input} placeholder="Nama user" value={userForm.name} onChangeText={v => setUserForm({ ...userForm, name: v })} />

                        <Text style={styles.label}>Email Address <Text style={styles.required}>*</Text></Text>
                        <TextInput style={styles.input} placeholder="email@example.com" keyboardType="email-address" value={userForm.email} onChangeText={v => setUserForm({ ...userForm, email: v })} />

                        <Text style={styles.label}>Password {isEditing && '(Kosongkan jika tidak ganti)'} {!isEditing && <Text style={styles.required}>*</Text>}</Text>
                        <TextInput style={styles.input} placeholder="Minimal 8 karakter" secureTextEntry value={userForm.password} onChangeText={v => setUserForm({ ...userForm, password: v })} />

                        <Text style={styles.label}>Role <Text style={styles.required}>*</Text></Text>
                        <View style={styles.row}>
                            {['staff', 'admin'].map(r => (
                                <TouchableOpacity
                                    key={r}
                                    style={[styles.roleOption, userForm.role === r && styles.roleOptionActive]}
                                    onPress={() => setUserForm({ ...userForm, role: r })}
                                >
                                    <Text style={[styles.roleText, userForm.role === r && styles.roleTextActive]}>{r.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.submitBtn} onPress={handleCreateOrUpdateUser} disabled={submitting}>
                            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isEditing ? 'Update User' : 'Simpan User'}</Text>}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Modal Setting Komisi */}
            <Modal visible={commissionModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.smallModalContent}>
                        <View style={styles.smallModalHeader}>
                            <Text style={styles.smallModalTitle}>Setting Komisi/STO</Text>
                            <TouchableOpacity onPress={() => setCommissionModalVisible(false)}>
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.smallModalBody}>
                            <Text style={styles.label}>Nilai Komisi (IDR)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Contoh: 1000"
                                keyboardType="numeric"
                                value={commissionValue}
                                onChangeText={v => setCommissionValue(v.replace(/[^0-9]/g, ''))}
                            />
                            <Text style={styles.helperText}>Berikan nilai komisi untuk setiap 1 buku yang diverifikasi oleh staff.</Text>
                        </View>
                        <View style={styles.smallModalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setCommissionModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateCommission} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Simpan</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    dashboardScroll: { padding: 16, paddingBottom: 40 },
    headerCard: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    tabContainer: { flexDirection: 'row', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 4, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    activeTab: { backgroundColor: '#fff', shadowColor: '#165DFF', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
    activeTabText: { color: '#165DFF' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    searchInput: { flex: 1, height: 44, marginLeft: 8, fontSize: 14, color: '#1e293b' },

    gridContainer: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    miniStat: { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center', marginBottom: 10 },
    miniStatVal: { fontSize: 16, fontWeight: '800', color: '#fff' },
    miniStatLabel: { fontSize: 9, color: '#FFFFFFCC', marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginLeft: 10 },
    conditionCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
    conditionItem: { marginBottom: 14 },
    conditionLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 },
    progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#165DFF' },
    conditionCount: { fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' },

    contributorItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 8 },
    rankText: { fontSize: 14, fontWeight: '800', color: '#94a3b8', width: 30 },
    contributorName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    contributorRole: { fontSize: 11, color: '#64748b' },
    contributorVal: { fontSize: 18, fontWeight: '800', color: '#165DFF' },
    avatarMini: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    avatarInitialSmall: { fontSize: 16, fontWeight: '700' },

    listContainer: { padding: 16, paddingBottom: 100 },
    listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 12, elevation: 1 },
    bookIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0f0ff', justifyContent: 'center', alignItems: 'center' },
    userAvatar: { width: 44, height: 44, borderRadius: 12 },
    itemContent: { flex: 1, marginLeft: 12 },
    itemTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    itemSubtitle: { fontSize: 11, color: '#64748b', marginTop: 2 },
    actionRow: { flexDirection: 'row', alignItems: 'center' },
    editBtn: { padding: 8, marginRight: 4 },
    deleteBtn: { padding: 8 },

    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#165DFF', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center' },

    modalContainer: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    modalIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    modalForm: { flex: 1, padding: 20 },
    formSection: { marginBottom: 24 },
    sectionTitleRow: { borderLeftWidth: 4, borderLeftColor: '#165DFF', paddingLeft: 12, marginBottom: 16, marginTop: 8 },
    formSectionTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
    label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, marginTop: 12 },
    required: { color: '#ef4444' },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, color: '#1e293b' },
    row: { flexDirection: 'row', gap: 10 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    checkboxActive: { backgroundColor: '#165DFF', borderColor: '#165DFF' },
    checkboxLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff' },
    submitBtn: { backgroundColor: '#165DFF', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#165DFF', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    roleOption: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
    roleOptionActive: { backgroundColor: '#e0e7ff', borderColor: '#165DFF' },
    roleText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
    roleTextActive: { color: '#165DFF' },

    // Commission Specific
    commissionHeaderCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginHorizontal: 4,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    iconCircleLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    commissionLabelBold: { fontSize: 13, fontWeight: '800', color: COLORS.textSub, letterSpacing: 1, textTransform: 'uppercase' },
    commissionValueLarge: { fontSize: 36, fontWeight: '900', color: '#1e293b', marginVertical: 12 },
    adjustBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, gap: 8 },
    adjustBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    rankBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 10 },

    // Small Modal for Settings
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    smallModalContent: { backgroundColor: '#fff', width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden' },
    smallModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    smallModalTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
    smallModalBody: { padding: 20 },
    helperText: { fontSize: 12, color: '#64748b', marginTop: 8, lineHeight: 18 },
    smallModalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    cancelBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    cancelBtnText: { color: '#64748b', fontWeight: '700' },
    saveBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.primary },
    saveBtnText: { color: '#fff', fontWeight: '700' },
});

export default ManagementScreen;

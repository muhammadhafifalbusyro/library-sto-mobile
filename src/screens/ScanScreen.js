import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    Platform,
    Dimensions,
    StatusBar,
    Modal,
} from 'react-native';
import {
    Search, Barcode, Book as BookIcon, Check,
    X, Camera as CameraIcon, History, ChevronRight
} from 'lucide-react-native';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
    useCodeScanner
} from 'react-native-vision-camera';
import apiClient from '../api/client';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#165DFF',
    white: '#FFFFFF',
    background: '#F8FAFC',
    textMain: '#1e293b',
    textSub: '#64748b',
    border: '#E2E8F0',
    green: '#22c55e',
};

const ScanScreen = () => {
    const [isbn, setIsbn] = useState('');
    const [loading, setLoading] = useState(false);
    const [book, setBook] = useState(null);
    const [status, setStatus] = useState(null);
    const [selectedConditions, setSelectedConditions] = useState([]);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [earnedCommission, setEarnedCommission] = useState(0);

    // Camera States
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const [isScanning, setIsScanning] = useState(true);

    const conditions = [
        "Baik", "Barcode lepas", "Barcode rusak", "Barcode salah", "Barcode tidak ada",
        "Label lepas", "Label salah", "Halaman sobek", "Halaman rusak", "Halaman lepas",
        "Halaman hilang", "Sampul sobek", "Sampul rusak", "Sampul lepas", "Sampul tidak ada",
        "Sampul rusak kena air", "Sampul rusak dimakan kutu", "Sampul rusak dimakan rayap", "Sampul rusak kena debu"
    ];

    useFocusEffect(
        useCallback(() => {
            if (!hasPermission) {
                requestPermission();
            }
            // Ensure search is fresh when navigating to this tab
            setIsScanning(true);
        }, [hasPermission])
    );

    const handleSearch = useCallback(async (code) => {
        if (!code) return;
        setLoading(true);
        setIsScanning(false);
        try {
            const response = await apiClient.get(`/books/${code}`);
            setBook(response.data.book);
            setStatus(response.data.status);
            setSelectedConditions([]); // Reset conditions for new book
            setNotes('');
        } catch (error) {
            console.error(error);
            Alert.alert('Gagal', 'Buku tidak ditemukan dalam database.', [
                { text: 'Coba Lagi', onPress: () => setIsScanning(true) }
            ]);
            setBook(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const codeScanner = useCodeScanner({
        codeTypes: ['ean-13', 'ean-8', 'code-128', 'qr'],
        onCodeScanned: (codes) => {
            if (isScanning && codes.length > 0 && codes[0].value) {
                const scannedValue = codes[0].value;
                setIsScanning(false);
                handleSearch(scannedValue);
            }
        }
    });

    const toggleCondition = (item) => {
        if (selectedConditions.includes(item)) {
            setSelectedConditions(selectedConditions.filter(c => c !== item));
        } else {
            setSelectedConditions([...selectedConditions, item]);
        }
    };

    const formatRupiah = (number) => {
        if (number === undefined || number === null) return 'Rp 0';
        return 'Rp ' + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleVerify = async () => {
        if (selectedConditions.length === 0) {
            Alert.alert('Peringatan', 'Harap pilih minimal satu kondisi buku.');
            return;
        }

        setSaving(true);
        try {
            const conditionStr = selectedConditions.join(', ');
            const response = await apiClient.post('/stock-opname', {
                book_id: book.id,
                status: 'verified',
                condition: conditionStr,
                notes,
            });

            const commission = response.data.earned_commission || 0;
            setEarnedCommission(commission);

            // Add to session history
            setHistory([{
                id: book.id,
                title: book.title,
                isbn: book.isbn_issn,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'verified'
            }, ...history]);

            setShowSuccess(true);
            setBook(null);
            setIsbn('');
            setIsScanning(true);
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Gagal menyimpan data.';
            Alert.alert('Gagal', msg);
        } finally {
            setSaving(false);
        }
    };

    const renderCamera = () => {
        if (!hasPermission) {
            return (
                <View style={styles.cameraPlaceholder}>
                    <Text style={styles.placeholderText}>Akses kamera diperlukan</Text>
                    <TouchableOpacity style={styles.btnSm} onPress={requestPermission}>
                        <Text style={styles.btnSmText}>Izinkan</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (!device) return <View style={styles.cameraPlaceholder}><ActivityIndicator color={COLORS.primary} /></View>;

        return (
            <View style={styles.cameraWrapper}>
                <Camera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={isScanning && !book}
                    codeScanner={codeScanner}
                />
                <View style={styles.cameraOverlay}>
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.tl]} />
                        <View style={[styles.corner, styles.tr]} />
                        <View style={[styles.corner, styles.bl]} />
                        <View style={[styles.corner, styles.br]} />
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* White/Light Header as per design */}
            <View style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerNav}>
                        <Text style={styles.headerTitle}>Scan Buku</Text>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* 1. Camera Section */}
                {!book && renderCamera()}

                {/* 2. Manual Input or Result */}
                {!book ? (
                    <View style={styles.manualCard}>
                        <View style={styles.cardHeader}>
                            <Barcode size={20} color={COLORS.textMain} />
                            <Text style={styles.cardTitle}>Input Manual</Text>
                        </View>
                        <View style={styles.inputRow}>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Masukkan ISBN / Kode Buku"
                                    placeholderTextColor="#94a3b8"
                                    value={isbn}
                                    onChangeText={setIsbn}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.searchBtn, !isbn && { opacity: 0.5 }]}
                                onPress={() => handleSearch(isbn)}
                                disabled={!isbn || loading}
                            >
                                {loading ? <ActivityIndicator color="#fff" size="small" /> : <ChevronRight size={24} color="#fff" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.resultCard}>
                        <View style={styles.bookInfoRow}>
                            <View style={styles.bookImageWrapper}>
                                {book.cover_url ? (
                                    <Image source={{ uri: book.cover_url }} style={styles.bookImage} />
                                ) : (
                                    <BookIcon size={32} color={COLORS.textSub} />
                                )}
                            </View>
                            <View style={styles.bookTexts}>
                                <Text style={styles.resultBookTitle} numberOfLines={2}>{book.title}</Text>
                                <Text style={styles.resultBookIsbn}>{book.isbn_issn}</Text>
                                <View style={[styles.statusTag, { backgroundColor: status === 'verified' ? '#dcfce7' : '#eff2f7' }]}>
                                    <Check size={12} color={status === 'verified' ? COLORS.green : COLORS.textSub} />
                                    <Text style={[styles.statusText, { color: status === 'verified' ? COLORS.green : COLORS.textSub }]}>
                                        {status === 'verified' ? 'Terverifikasi' : 'Belum Verifikasi'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {status !== 'verified' && (
                            <View style={styles.verificationForm}>
                                <Text style={styles.sectionLabel}>Kondisi Buku (Bisa pilih lebih dari satu)</Text>
                                <View style={styles.conditionsGrid}>
                                    {conditions.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.conditionChip,
                                                selectedConditions.includes(item) && styles.conditionChipActive
                                            ]}
                                            onPress={() => toggleCondition(item)}
                                        >
                                            <View style={[
                                                styles.checkbox,
                                                selectedConditions.includes(item) && styles.checkboxActive
                                            ]}>
                                                {selectedConditions.includes(item) && <Check size={10} color={COLORS.white} strokeWidth={4} />}
                                            </View>
                                            <Text style={[
                                                styles.conditionChipText,
                                                selectedConditions.includes(item) && styles.conditionChipTextActive
                                            ]}>
                                                {item}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Catatan Tambahan</Text>
                                <TextInput
                                    style={styles.notesInput}
                                    placeholder="Opsional..."
                                    placeholderTextColor="#94a3b8"
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                />

                                <TouchableOpacity
                                    style={styles.saveBtn}
                                    onPress={handleVerify}
                                    disabled={saving}
                                >
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Simpan Verifikasi</Text>}
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity style={styles.cancelLink} onPress={() => { setBook(null); setIsScanning(true); }}>
                            <Text style={styles.cancelLinkText}>Batalkan & Scan Ulang</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* 3. Session History */}
                {!book && history.length > 0 && (
                    <View style={styles.historySection}>
                        <View style={styles.historyHeader}>
                            <Text style={styles.historyTitle}>Riwayat Sesi Ini</Text>
                            <View style={styles.historyBadge}>
                                <Text style={styles.historyBadgeText}>{history.length} Buku</Text>
                            </View>
                        </View>

                        {history.map((item, index) => (
                            <View key={index} style={styles.historyItem}>
                                <View style={styles.historyIconBox}>
                                    <BookIcon size={20} color={COLORS.textSub} />
                                </View>
                                <View style={styles.historyInfo}>
                                    <Text style={styles.historyBookTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.historyBookMeta}>ISBN: {item.isbn} • {item.time}</Text>
                                    <View style={styles.historyStatus}>
                                        <Check size={10} color={COLORS.green} />
                                        <Text style={styles.historyStatusText}>Terverifikasi</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

            </ScrollView>

            {/* Success Modal matching Web version */}
            <Modal visible={showSuccess} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.successModalContent}>
                        <View style={styles.successIconWrapper}>
                            <Check size={40} color={COLORS.green} strokeWidth={3} />
                        </View>
                        <Text style={styles.successTitle}>Data Tersimpan!</Text>
                        <Text style={styles.successMessage}>
                            Stok opname untuk buku ini telah berhasil diverifikasi.
                        </Text>

                        {earnedCommission > 0 && (
                            <View style={styles.commissionBox}>
                                <Text style={styles.commissionLabel}>KOMISI DIDAPATKAN</Text>
                                <Text style={styles.commissionValue}>{formatRupiah(earnedCommission)}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.closeModalBtn}
                            onPress={() => setShowSuccess(false)}
                        >
                            <Text style={styles.closeModalBtnText}>Tutup & Scan Lagi</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        backgroundColor: COLORS.background,
        paddingBottom: 10,
    },
    headerNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 0 : 20,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textMain,
    },
    navBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    cameraWrapper: {
        width: '100%',
        height: 380,
        borderRadius: 24,
        overflow: 'hidden',
        marginTop: 20,
        backgroundColor: '#000',
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    scanFrame: {
        width: 200,
        height: 200,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: COLORS.white,
        borderWidth: 4,
    },
    tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
    tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
    bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
    br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
    cameraPlaceholder: {
        width: '100%',
        height: 380,
        backgroundColor: '#f1f5f9',
        borderRadius: 24,
        marginTop: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: { color: COLORS.textSub, fontWeight: '600' },
    btnSm: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginTop: 12 },
    btnSmText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },

    manualCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 24,
        marginTop: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
    cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textMain },
    inputRow: { flexDirection: 'row', gap: 10 },
    inputContainer: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        justifyContent: 'center',
    },
    input: { color: COLORS.textMain, fontWeight: '600', fontSize: 15 },
    searchBtn: {
        width: 56,
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    resultCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 24,
        marginTop: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    bookInfoRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    bookImageWrapper: {
        width: 80,
        height: 110,
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    bookImage: { width: '100%', height: '100%' },
    bookTexts: { flex: 1, justifyContent: 'center' },
    resultBookTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain, marginBottom: 4 },
    resultBookIsbn: { fontSize: 13, color: COLORS.textSub, marginBottom: 10 },
    statusTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 50,
        alignSelf: 'flex-start',
        gap: 6,
    },
    statusText: { fontSize: 11, fontWeight: '700' },

    verificationForm: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 20 },
    sectionLabel: { fontSize: 13, fontWeight: '800', color: COLORS.textMain, marginBottom: 12 },
    conditionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    conditionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 8,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: COLORS.textSub,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    conditionChipActive: {
        backgroundColor: COLORS.primary + '08',
        borderColor: COLORS.primary + '30',
    },
    conditionChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSub },
    conditionChipTextActive: { color: COLORS.primary },
    notesInput: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 16,
        height: 80,
        textAlignVertical: 'top',
        fontSize: 14,
        color: COLORS.textMain,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 18,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
    cancelLink: { marginTop: 16, alignItems: 'center' },
    cancelLinkText: { color: COLORS.textSub, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },

    historySection: { marginTop: 32 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    historyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
    historyBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
    historyBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    historyIconBox: {
        width: 44,
        height: 44,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    historyInfo: { flex: 1 },
    historyBookTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textMain },
    historyBookMeta: { fontSize: 11, color: COLORS.textSub, marginTop: 2 },
    historyStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    historyStatusText: { fontSize: 10, fontWeight: '800', color: COLORS.green },

    // Success Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    successModalContent: {
        backgroundColor: COLORS.white,
        width: '100%',
        borderRadius: 30,
        padding: 32,
        alignItems: 'center',
    },
    successIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.green + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.textMain,
        marginBottom: 8,
    },
    successMessage: {
        fontSize: 14,
        color: COLORS.textSub,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    commissionBox: {
        width: '100%',
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FFEDD5',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    commissionLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#C2410C',
        letterSpacing: 1,
        marginBottom: 4,
    },
    commissionValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#9A3412',
    },
    closeModalBtn: {
        width: '100%',
        backgroundColor: '#F1F5F9',
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeModalBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textMain,
    },
});

export default ScanScreen;

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { X, Search, Check } from 'lucide-react-native';
import { colors } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { clientsService } from '@/src/shared/services/clients.service';

const t = {
    title: isRTL ? 'اختر العملاء' : 'Select Clients',
    save: isRTL ? 'حفظ' : 'Save',
    search: isRTL ? 'البحث عن العملاء...' : 'Search clients...',
    noClients: isRTL ? 'لا يوجد عملاء' : 'No clients found',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    selected: isRTL ? 'مختار' : 'selected',
};

interface ClientItem {
    id: string;
    name: string;
    firstName: string;
    lastName?: string;
    avatar: string | null;
}

interface Props {
    visible: boolean;
    selectedIds: string[];
    onSave: (ids: string[]) => void;
    onClose: () => void;
}

export default function ClientPickerModal({ visible, selectedIds, onSave, onClose }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<ClientItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tempSelected, setTempSelected] = useState<string[]>([]);

    useEffect(() => {
        if (visible) {
            setTempSelected(selectedIds);
            setSearchTerm('');
        }
    }, [visible, selectedIds]);

    useEffect(() => {
        if (!visible) return;
        setIsLoading(true);
        clientsService
            .getClients('all', searchTerm)
            .then(({ clients: fetched }) => {
                setClients(
                    fetched.map(c => ({
                        id: c.id,
                        name: c.name,
                        firstName: c.firstName,
                        lastName: c.lastName,
                        avatar: c.avatar,
                    }))
                );
            })
            .catch(() => setClients([]))
            .finally(() => setIsLoading(false));
    }, [visible, searchTerm]);

    const toggleClient = useCallback((id: string) => {
        setTempSelected(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);

    const handleSave = useCallback(() => {
        onSave(tempSelected);
        onClose();
    }, [tempSelected, onSave, onClose]);

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length > 1
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : name.substring(0, 2).toUpperCase();
    };

    const renderClient = ({ item }: { item: ClientItem }) => {
        const isSelected = tempSelected.includes(item.id);
        return (
            <TouchableOpacity
                style={[styles.clientRow, isSelected && styles.clientRowSelected]}
                onPress={() => toggleClient(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.clientLeft}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Check size={horizontalScale(14)} color="#FFF" />}
                    </View>
                    <Text style={styles.clientName}>{item.name}</Text>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>{t.save}</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {t.title} ({tempSelected.length} {t.selected})
                    </Text>
                    <TouchableOpacity onPress={onClose} hitSlop={12}>
                        <X size={horizontalScale(24)} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Search size={horizontalScale(18)} color={colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholder={t.search}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                {/* Client List */}
                {isLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primaryDark} />
                        <Text style={styles.loadingText}>{t.loading}</Text>
                    </View>
                ) : clients.length === 0 ? (
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>{t.noClients}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={clients}
                        keyExtractor={item => item.id}
                        renderItem={renderClient}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(14),
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    saveBtn: {
        backgroundColor: colors.primaryDark,
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(8),
    },
    saveBtnText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#FFF',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(10),
        backgroundColor: colors.bgPrimary,
        margin: horizontalScale(16),
        paddingHorizontal: horizontalScale(14),
        paddingVertical: verticalScale(10),
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        textAlign: 'right',
    },
    list: {
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(32),
    },
    clientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.bgPrimary,
        paddingHorizontal: horizontalScale(14),
        paddingVertical: verticalScale(12),
        borderRadius: horizontalScale(12),
        marginBottom: verticalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
    },
    clientRowSelected: {
        borderColor: colors.primaryDark,
        backgroundColor: colors.primaryDark + '08',
    },
    clientLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(12),
        flex: 1,
    },
    checkbox: {
        width: horizontalScale(24),
        height: horizontalScale(24),
        borderRadius: horizontalScale(12),
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: colors.primaryDark,
        borderColor: colors.primaryDark,
    },
    avatar: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        backgroundColor: colors.primaryDark + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.primaryDark,
    },
    clientName: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'right',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: verticalScale(12),
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    emptyText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
});

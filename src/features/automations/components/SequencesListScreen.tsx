import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    Plus,
    Zap,
    Pause,
    Play,
    Pencil,
    Trash2,
    ChevronRight,
    Users,
} from 'lucide-react-native';
import { colors } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { useSequences } from '../hooks/useSequences';
import type { Sequence } from '@/src/shared/services/sequences.service';

const t = {
    title: isRTL ? 'automation' : 'Automations',
    subtitle: isRTL ? 'ادارة تسلسلات الرسائل التلقائية' : 'Manage automated message sequences',
    newSequence: isRTL ? 'تسلسل جديد' : 'New Sequence',
    active: isRTL ? 'نشط' : 'Active',
    paused: isRTL ? 'متوقف' : 'Paused',
    trigger: isRTL ? 'المحفز' : 'Trigger',
    steps: isRTL ? 'خطوات' : 'steps',
    lastUpdated: isRTL ? 'اخر تحديث' : 'Last updated',
    noSequences: isRTL ? 'لا توجد تسلسلات بعد' : 'No sequences yet',
    noSequencesDesc: isRTL
        ? 'انشئ اول تسلسل تلقائي لارسال رسائل للعملاء'
        : 'Create your first automated sequence to send messages to clients',
    deleteConfirm: isRTL ? 'هل انت متاكد من الحذف؟' : 'Are you sure you want to delete this sequence?',
    deleteTitle: isRTL ? 'حذف التسلسل' : 'Delete Sequence',
    cancel: isRTL ? 'الغاء' : 'Cancel',
    delete: isRTL ? 'حذف' : 'Delete',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    clients: isRTL ? 'عملاء' : 'clients',
    meal_missed: isRTL ? 'وجبة فائتة' : 'Meal Missed',
};

function formatTrigger(event: string): string {
    if (event === 'meal_missed') return t.meal_missed;
    return event.replace(/_/g, ' ');
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function SequenceCard({
    item,
    onEdit,
    onDelete,
}: {
    item: Sequence;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <TouchableOpacity style={styles.card} onPress={onEdit} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                    <Zap size={horizontalScale(18)} color={colors.primaryDark} />
                    <Text style={styles.cardName} numberOfLines={1}>
                        {item.name}
                    </Text>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: item.isActive ? '#10B98120' : '#F59E0B20' },
                    ]}
                >
                    {item.isActive ? (
                        <Play size={horizontalScale(12)} color="#10B981" />
                    ) : (
                        <Pause size={horizontalScale(12)} color="#F59E0B" />
                    )}
                    <Text
                        style={[
                            styles.statusText,
                            { color: item.isActive ? '#10B981' : '#F59E0B' },
                        ]}
                    >
                        {item.isActive ? t.active : t.paused}
                    </Text>
                </View>
            </View>

            <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>{t.trigger}:</Text>
                    <Text style={styles.metaValue}>{formatTrigger(item.triggerEvent)}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>{item.steps.length} {t.steps}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Users size={horizontalScale(12)} color={colors.textSecondary} />
                    <Text style={styles.metaLabel}>
                        {item.clientIds?.length || 0} {t.clients}
                    </Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.updatedText}>
                    {t.lastUpdated} {formatDate(item.updatedAt)}
                </Text>
                <View style={styles.cardActions}>
                    <TouchableOpacity onPress={onEdit} hitSlop={8} style={styles.actionBtn}>
                        <Pencil size={horizontalScale(16)} color={colors.primaryDark} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.actionBtn}>
                        <Trash2 size={horizontalScale(16)} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function SequencesListScreen() {
    const router = useRouter();
    const { sequences, loading, refetch, deleteSequence } = useSequences();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const handleDelete = useCallback(
        (seq: Sequence) => {
            Alert.alert(t.deleteTitle, t.deleteConfirm, [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.delete,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSequence(seq._id);
                        } catch {
                            Alert.alert('Error', 'Failed to delete sequence');
                        }
                    },
                },
            ]);
        },
        [deleteSequence]
    );

    const handleEdit = useCallback(
        (id: string) => {
            router.push(`/doctor/sequence-editor?id=${id}`);
        },
        [router]
    );

    const handleNew = useCallback(() => {
        router.push('/doctor/sequence-editor');
    }, [router]);

    if (loading && sequences.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <Header onBack={() => router.back()} onNew={handleNew} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['right','left']} style={styles.container}>
            <Header onBack={() => router.back()} onNew={handleNew} />
            {sequences.length === 0 ? (
                <View style={styles.center}>
                    <Zap size={horizontalScale(56)} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>{t.noSequences}</Text>
                    <Text style={styles.emptyDesc}>{t.noSequencesDesc}</Text>
                    <TouchableOpacity style={styles.createBtn} onPress={handleNew}>
                        <Plus size={horizontalScale(18)} color="#FFF" />
                        <Text style={styles.createBtnText}>{t.newSequence}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={sequences}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primaryDark}
                        />
                    }
                    renderItem={({ item }) => (
                        <SequenceCard
                            item={item}
                            onEdit={() => handleEdit(item._id)}
                            onDelete={() => handleDelete(item)}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}

function Header({ onBack, onNew }: { onBack: () => void; onNew: () => void }) {
    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.header,{paddingTop:insets.top}]}>
            <TouchableOpacity onPress={onNew} style={styles.addBtn}>
                <Plus size={horizontalScale(20)} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>{t.title}</Text>
                <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onBack} hitSlop={12} style={styles.backBtn}>
                <ChevronRight size={horizontalScale(24)} color={colors.textPrimary} />
            </TouchableOpacity>

        </View>
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
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        padding: horizontalScale(4),
    },
    headerCenter: {
        flex: 1,
        marginHorizontal: horizontalScale(12),
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    headerSubtitle: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(2),
    },
    addBtn: {
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: horizontalScale(18),
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        padding: horizontalScale(16),
        paddingBottom: verticalScale(32),
    },
    card: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        marginBottom: verticalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(10),
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(8),
        flex: 1,
    },
    cardName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(4),
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(12),
    },
    statusText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
    },
    cardMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: horizontalScale(12),
        marginBottom: verticalScale(10),
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    metaLabel: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    metaValue: {
        fontSize: ScaleFontSize(12),
        color: colors.textPrimary,
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: verticalScale(10),
    },
    updatedText: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
    },
    cardActions: {
        flexDirection: 'row',
        gap: horizontalScale(12),
    },
    actionBtn: {
        padding: horizontalScale(4),
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(32),
        gap: verticalScale(12),
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    emptyTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        marginTop: verticalScale(8),
    },
    emptyDesc: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'center',
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(8),
        backgroundColor: colors.primaryDark,
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(12),
        borderRadius: horizontalScale(12),
        marginTop: verticalScale(8),
    },
    createBtnText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#FFF',
    },
});

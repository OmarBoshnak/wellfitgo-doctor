import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    Plus,
    GitBranch,
    Trash2,
    Save,
    ChevronRight,
    Users,
    ChevronLeft,
} from 'lucide-react-native';
import { colors } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { useSequence, useSaveSequence } from '../hooks/useSequences';
import StepEditorModal from './StepEditorModal';
import ClientPickerModal from './ClientPickerModal';
import type { SequenceStep } from '@/src/shared/services/sequences.service';

const t = {
    newSequence: isRTL ? 'تسلسل جديد' : 'New Sequence',
    editSequence: isRTL ? 'تعديل التسلسل' : 'Edit Sequence',
    save: isRTL ? 'حفظ' : 'Save',
    name: isRTL ? 'اسم التسلسل' : 'Sequence Name',
    namePlaceholder: isRTL ? 'مثال: تذكير بالوجبة الفائتة' : 'e.g. Missed Meal Reminder',
    triggerEvent: isRTL ? 'الحدث المحفز' : 'Trigger Event',
    triggerPlaceholder: isRTL ? 'مثال: meal_missed' : 'e.g. meal_missed',
    status: isRTL ? 'الحالة' : 'Status',
    active: isRTL ? 'نشط' : 'Active',
    paused: isRTL ? 'متوقف' : 'Paused',
    clients: isRTL ? 'العملاء' : 'Clients',
    selectClients: isRTL ? 'اختر العملاء' : 'Select Clients',
    selectedCount: isRTL ? 'عميل مختار' : 'selected',
    steps: isRTL ? 'الخطوات' : 'Steps',
    addStep: isRTL ? 'اضافة خطوة' : 'Add Step',
    noSteps: isRTL ? 'لا توجد خطوات بعد' : 'No steps yet',
    addStepDesc: isRTL
        ? 'اضف خطوات لتحديد سلوك التسلسل'
        : 'Add steps to define sequence behavior',
    message: isRTL ? 'رسالة' : 'Message',
    condition: isRTL ? 'شرط' : 'Condition',
    saved: isRTL ? 'تم الحفظ' : 'Saved!',
    error: isRTL ? 'خطا' : 'Error',
    nameRequired: isRTL ? 'الاسم مطلوب' : 'Name is required',
    triggerRequired: isRTL ? 'الحدث المحفز مطلوب' : 'Trigger event is required',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    deleteStep: isRTL ? 'حذف الخطوة' : 'Delete Step',
    deleteStepConfirm: isRTL ? 'هل تريد حذف هذه الخطوة؟' : 'Delete this step?',
    cancel: isRTL ? 'الغاء' : 'Cancel',
    delete: isRTL ? 'حذف' : 'Delete',
    send: isRTL ? 'ارسال' : 'Send',
    immediately: isRTL ? 'فوراً' : 'Immediately',
    afterDays: isRTL ? 'بعد' : 'After',
    dayLabel: isRTL ? 'يوم' : 'day',
    daysLabel: isRTL ? 'أيام' : 'days',
    anyDay: isRTL ? 'أي يوم' : 'Any Day',
};

const DAY_LABELS: Record<string, string> = {
    any: t.anyDay,
    saturday: isRTL ? 'السبت' : 'Saturday',
    sunday: isRTL ? 'الأحد' : 'Sunday',
    monday: isRTL ? 'الاثنين' : 'Monday',
    tuesday: isRTL ? 'الثلاثاء' : 'Tuesday',
    wednesday: isRTL ? 'الأربعاء' : 'Wednesday',
    thursday: isRTL ? 'الخميس' : 'Thursday',
    friday: isRTL ? 'الجمعة' : 'Friday',
};

function StepCard({
    step,
    onEdit,
    onDelete,
    onToggleActive,
}: {
    step: SequenceStep;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: (active: boolean) => void;
}) {
    if (step.type === 'message') {
        const delayDays = step.delayDays ?? 0;
        const delayText = delayDays === 0
            ? t.immediately
            : `${t.afterDays} ${delayDays} ${delayDays === 1 ? t.dayLabel : t.daysLabel}`;
        const startH = String(step.sendWindowStartHour ?? 9).padStart(2, '0');
        const startM = String(step.sendWindowStartMinute ?? 0).padStart(2, '0');
        const endH = String(step.sendWindowEndHour ?? 10).padStart(2, '0');
        const endM = String(step.sendWindowEndMinute ?? 0).padStart(2, '0');
        const windowText = `${startH}:${startM}-${endH}:${endM}`;
        // Handle both single sendDay and array of sendDays
        const sendDayValue = step.sendDay || 'any';
        const dayText = Array.isArray(sendDayValue)
            ? sendDayValue.map(d => DAY_LABELS[d] || d).join(', ')
            : (DAY_LABELS[sendDayValue] || t.anyDay);
        const preview = step.messageContent
            ? step.messageContent.substring(0, 50) + (step.messageContent.length > 50 ? '...' : '')
            : '(empty)';

        return (
            <TouchableOpacity style={styles.stepCard} onPress={onEdit} activeOpacity={0.7}>
                <View style={styles.stepRow}>
                    <View style={styles.stepTimingCol}>
                        <Text style={styles.stepTimingText}>{delayText}</Text>
                        <Text style={styles.stepTimingText}>{windowText}</Text>
                        <Text style={styles.stepTimingText}>{dayText}</Text>
                    </View>
                    <View style={styles.stepDivider} />
                    <Switch
                        value={step.isActive !== false}
                        onValueChange={onToggleActive}
                        trackColor={{ true: colors.primaryDark, false: colors.border }}
                        style={{ transform: [{ scaleX: -1 }] }}
                    />
                    <View style={styles.stepContentCol}>
                        <Text style={styles.stepLabel}>{t.send}</Text>
                        <Text style={styles.stepDesc} numberOfLines={2}>{preview}</Text>
                    </View>
                    <TouchableOpacity onPress={onDelete} hitSlop={12} style={styles.stepDeleteBtn}>
                        <Trash2 size={horizontalScale(14)} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    }

    // Condition step
    return (
        <TouchableOpacity style={styles.stepCard} onPress={onEdit} activeOpacity={0.7}>
            <View style={styles.stepLeft}>
                <View style={[styles.stepIconBg, { backgroundColor: '#8B5CF620' }]}>
                    <GitBranch size={horizontalScale(16)} color="#8B5CF6" />
                </View>
                <View style={styles.conditionContent}>
                    <Text style={[styles.stepType, { color: '#8B5CF6' }]}>{t.condition}</Text>
                    <Text style={styles.stepDesc}>
                        {step.conditionField} {step.conditionOperator} {step.conditionValue}
                    </Text>
                </View>
            </View>
            <TouchableOpacity onPress={onDelete} hitSlop={12} style={styles.stepDeleteBtn}>
                <Trash2 size={horizontalScale(16)} color={colors.error} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

export default function SequenceEditorScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string }>();
    const insets = useSafeAreaInsets();
    const sequenceId = params.id || null;

    const { sequence, loading: loadingSequence } = useSequence(sequenceId);
    const { save, saving } = useSaveSequence();

    const [name, setName] = useState('');
    const [triggerEvent, setTriggerEvent] = useState('meal_missed');
    const [isActive, setIsActive] = useState(true);
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
    const [steps, setSteps] = useState<SequenceStep[]>([]);

    // Modals
    const [stepModalVisible, setStepModalVisible] = useState(false);
    const [editingStep, setEditingStep] = useState<SequenceStep | null>(null);
    const [showClientPicker, setShowClientPicker] = useState(false);

    // Populate from loaded sequence
    useEffect(() => {
        if (sequence) {
            setName(sequence.name);
            setTriggerEvent(sequence.triggerEvent);
            setIsActive(sequence.isActive);
            setSelectedClientIds(sequence.clientIds || []);
            // Filter out old 'delay' steps for backward compat
            setSteps(
                [...sequence.steps]
                    .filter(s => (s.type as string) !== 'delay')
                    .sort((a, b) => a.stepOrder - b.stepOrder)
            );
        }
    }, [sequence]);

    const handleSave = useCallback(async () => {
        if (!name.trim()) {
            Alert.alert(t.error, t.nameRequired);
            return;
        }
        if (!triggerEvent.trim()) {
            Alert.alert(t.error, t.triggerRequired);
            return;
        }

        try {
            await save(sequenceId, {
                name: name.trim(),
                triggerEvent: triggerEvent.trim(),
                isActive,
                clientIds: selectedClientIds,
                steps,
            });
            Alert.alert(t.saved, '', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: any) {
            Alert.alert(t.error, e.message || 'Failed to save');
        }
    }, [name, triggerEvent, isActive, selectedClientIds, steps, sequenceId, save, router]);

    const handleAddStep = useCallback(() => {
        setEditingStep(null);
        setStepModalVisible(true);
    }, []);

    const handleEditStep = useCallback((step: SequenceStep) => {
        setEditingStep(step);
        setStepModalVisible(true);
    }, []);

    const handleDeleteStep = useCallback((step: SequenceStep) => {
        Alert.alert(t.deleteStep, t.deleteStepConfirm, [
            { text: t.cancel, style: 'cancel' },
            {
                text: t.delete,
                style: 'destructive',
                onPress: () => {
                    setSteps(prev => prev.filter(s => s.stepOrder !== step.stepOrder));
                },
            },
        ]);
    }, []);

    const handleStepSave = useCallback((step: SequenceStep) => {
        setSteps(prev => {
            const exists = prev.find(s => s.stepOrder === step.stepOrder);
            if (exists) {
                return prev.map(s => (s.stepOrder === step.stepOrder ? step : s));
            }
            return [...prev, step].sort((a, b) => a.stepOrder - b.stepOrder);
        });
        setStepModalVisible(false);
    }, []);

    const handleToggleStepActive = useCallback((stepOrder: number, active: boolean) => {
        setSteps(prev => prev.map(s =>
            s.stepOrder === stepOrder ? { ...s, isActive: active } : s
        ));
    }, []);

    const nextStepOrder = steps.length > 0 ? Math.max(...steps.map(s => s.stepOrder)) + 1 : 0;

    if (loadingSequence && sequenceId) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity
                    onPress={handleSave}
                    style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <>
                            <Save size={horizontalScale(16)} color="#FFF" />
                            <Text style={styles.saveBtnText}>{t.save}</Text>
                        </>
                    )}
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {sequenceId ? t.editSequence : t.newSequence}
                </Text>

                <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                    <ChevronRight size={horizontalScale(24)} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Name */}
                <Text style={styles.label}>{t.name}</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder={t.namePlaceholder}
                    placeholderTextColor={colors.textSecondary}
                />

                {/* Trigger Event */}
                <Text style={styles.label}>{t.triggerEvent}</Text>
                <TextInput
                    style={styles.input}
                    value={triggerEvent}
                    onChangeText={setTriggerEvent}
                    placeholder={t.triggerPlaceholder}
                    placeholderTextColor={colors.textSecondary}
                />

                {/* Status Toggle */}
                <View style={styles.toggleRow}>
                    <View style={styles.toggleRight}>
                        <Switch
                            value={isActive}
                            onValueChange={setIsActive}
                            trackColor={{ true: colors.primaryDark, false: colors.border }}
                            style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                        />
                        <Text style={styles.toggleLabel}>
                            {isActive ? t.active : t.paused}
                        </Text>
                    </View>
                    <Text style={styles.label}>{t.status}</Text>
                </View>

                {/* Client Picker */}
                <Text style={styles.sectionTitle}>{t.clients}</Text>
                <TouchableOpacity
                    style={styles.clientPickerBtn}
                    onPress={() => setShowClientPicker(true)}
                >
                    <ChevronLeft size={horizontalScale(16)} color={colors.textSecondary} />

                    <Text style={styles.clientPickerText}>
                        {selectedClientIds.length > 0
                            ? `${selectedClientIds.length} ${t.selectedCount}`
                            : t.selectClients}
                    </Text>
                    <Users size={horizontalScale(18)} color={colors.primaryDark} />

                </TouchableOpacity>

                {/* Steps */}
                <View style={styles.stepsHeader}>
                    <TouchableOpacity onPress={handleAddStep} style={styles.addStepBtn}>
                        <Plus size={horizontalScale(16)} color={colors.primaryDark} />
                        <Text style={styles.addStepText}>{t.addStep}</Text>
                    </TouchableOpacity>
                    <Text style={styles.sectionTitle}>{t.steps}</Text>
                </View>

                {steps.length === 0 ? (
                    <View style={styles.emptySteps}>
                        <Text style={styles.emptyStepsTitle}>{t.noSteps}</Text>
                        <Text style={styles.emptyStepsDesc}>{t.addStepDesc}</Text>
                    </View>
                ) : (
                    steps.map(step => (
                        <StepCard
                            key={step.stepOrder}
                            step={step}
                            onEdit={() => handleEditStep(step)}
                            onDelete={() => handleDeleteStep(step)}
                            onToggleActive={(active) => handleToggleStepActive(step.stepOrder, active)}
                        />
                    ))
                )}

                <View style={{ height: verticalScale(40) }} />
            </ScrollView>

            <StepEditorModal
                visible={stepModalVisible}
                step={editingStep}
                onSave={handleStepSave}
                onClose={() => setStepModalVisible(false)}
                nextStepOrder={nextStepOrder}
            />

            <ClientPickerModal
                visible={showClientPicker}
                selectedIds={selectedClientIds}
                onSave={setSelectedClientIds}
                onClose={() => setShowClientPicker(false)}
            />
        </SafeAreaView>
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
        paddingVertical: verticalScale(12),
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(6),
        backgroundColor: colors.primaryDark,
        paddingHorizontal: horizontalScale(14),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(8),
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#FFF',
    },
    body: {
        flex: 1,
    },
    bodyContent: {
        padding: horizontalScale(16),
    },
    label: {
        fontSize: ScaleFontSize(13),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(6),
        marginTop: verticalScale(14),
        textAlign: 'right',
    },
    input: {
        backgroundColor: colors.bgPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: horizontalScale(12),
        paddingHorizontal: horizontalScale(14),
        paddingVertical: verticalScale(12),
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        textAlign: 'right',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: verticalScale(14),
    },
    toggleRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(10),
    },
    toggleLabel: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
    },
    sectionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: verticalScale(24),
        marginBottom: verticalScale(4),
        textAlign: 'right',
    },
    clientPickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(10),
        backgroundColor: colors.bgPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: horizontalScale(12),
        paddingHorizontal: horizontalScale(14),
        paddingVertical: verticalScale(14),
        marginTop: verticalScale(8),
    },
    clientPickerText: {
        flex: 1,
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        textAlign: 'right',
    },
    stepsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(8),
    },
    addStepBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(6),
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.primaryDark,
    },
    addStepText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: colors.primaryDark,
    },
    emptySteps: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(24),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    emptyStepsTitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    emptyStepsDesc: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
        textAlign: 'center',
    },
    // Step card styles
    stepCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(12),
        marginBottom: verticalScale(8),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepTimingCol: {
        width: horizontalScale(100),
        gap: verticalScale(2),
    },
    stepTimingText: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        textAlign: 'right',
    },
    stepDivider: {
        width: 1,
        alignSelf: 'stretch' as const,
        backgroundColor: colors.border,
        marginHorizontal: horizontalScale(10),
    },
    stepContentCol: {
        flex: 1,
    },
    stepLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: colors.primaryDark,
        marginBottom: verticalScale(2),
        textAlign: 'right',
    },
    stepDesc: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        lineHeight: ScaleFontSize(16),
        textAlign: 'right',
    },
    stepDeleteBtn: {
        padding: horizontalScale(6),
    },
    // Condition step
    stepLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: horizontalScale(10),
    },
    stepIconBg: {
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: horizontalScale(10),
        alignItems: 'center',
        justifyContent: 'center',
    },
    conditionContent: {
        flex: 1,
    },
    stepType: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
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
});

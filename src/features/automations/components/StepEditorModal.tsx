import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from 'react-native';
import { X, MessageSquare, GitBranch, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import type { SequenceStep, SendDay } from '@/src/shared/services/sequences.service';

const t = {
    editStep: isRTL ? 'تعديل الخطوة' : 'Edit Step',
    addStep: isRTL ? 'اضافة خطوة' : 'Add Step',
    save: isRTL ? 'حفظ' : 'Save',
    cancel: isRTL ? 'الغاء' : 'Cancel',
    stepType: isRTL ? 'نوع الخطوة' : 'Step Type',
    message: isRTL ? 'رسالة' : 'Message',
    condition: isRTL ? 'شرط' : 'Condition',
    messageContent: isRTL ? 'محتوى الرسالة (انجليزي)' : 'Message Content (English)',
    messageContentAr: isRTL ? 'محتوى الرسالة (عربي)' : 'Message Content (Arabic)',
    conditionField: isRTL ? 'حقل الشرط' : 'Condition Field',
    conditionOperator: isRTL ? 'العملية' : 'Operator',
    conditionValue: isRTL ? 'القيمة' : 'Value',
    trueBranch: isRTL ? 'خطوة اذا صحيح' : 'Step if True',
    falseBranch: isRTL ? 'خطوة اذا خطا' : 'Step if False',
    messagePlaceholder: isRTL ? 'اكتب الرسالة هنا...' : 'Type your message here...',
    preview: isRTL ? 'معاينة المتغيرات' : 'Variable Preview',
    previewHint: isRTL
        ? 'المتغيرات: {{clientName}}, {{mealType}}, {{date}}'
        : 'Variables: {{clientName}}, {{mealType}}, {{date}}',
    mealCompletedWithin: 'meal_completed_within',
    delayDays: isRTL ? 'التأخير (أيام)' : 'Delay (Days)',
    immediately: isRTL ? 'فوراً' : 'Immediately',
    day: isRTL ? 'يوم' : 'day',
    days: isRTL ? 'أيام' : 'days',
    sendWindow: isRTL ? 'نافذة الارسال' : 'Send Window',
    sendDay: isRTL ? 'يوم الارسال' : 'Send Day',
    anyDay: isRTL ? 'أي يوم' : 'Any Day',
    saturday: isRTL ? 'السبت' : 'Saturday',
    sunday: isRTL ? 'الأحد' : 'Sunday',
    monday: isRTL ? 'الاثنين' : 'Monday',
    tuesday: isRTL ? 'الثلاثاء' : 'Tuesday',
    wednesday: isRTL ? 'الأربعاء' : 'Wednesday',
    thursday: isRTL ? 'الخميس' : 'Thursday',
    friday: isRTL ? 'الجمعة' : 'Friday',
    stepActive: isRTL ? 'الخطوة نشطة' : 'Step Active',
};

const STEP_TYPES: { key: SequenceStep['type']; label: string; icon: any }[] = [
    { key: 'message', label: t.message, icon: MessageSquare },
    { key: 'condition', label: t.condition, icon: GitBranch },
];

const CONDITION_FIELDS = [
    { value: 'meal_completed_within', label: t.mealCompletedWithin },
];

const OPERATORS = [
    { value: 'eq', label: '= (eq)' },
    { value: 'neq', label: '!= (neq)' },
    { value: 'gt', label: '> (gt)' },
    { value: 'lt', label: '< (lt)' },
    { value: 'exists', label: 'exists' },
];

const DELAY_OPTIONS = [
    { value: 0, label: t.immediately },
    { value: 1, label: `1 ${t.day}` },
    { value: 2, label: `2 ${t.days}` },
    { value: 3, label: `3 ${t.days}` },
    { value: 4, label: `4 ${t.days}` },
    { value: 5, label: `5 ${t.days}` },
    { value: 7, label: `7 ${t.days}` },
    { value: 14, label: `14 ${t.days}` },
];

const SEND_DAY_OPTIONS: { value: SendDay; label: string }[] = [
    { value: 'any', label: t.anyDay },
    { value: 'saturday', label: t.saturday },
    { value: 'sunday', label: t.sunday },
    { value: 'monday', label: t.monday },
    { value: 'tuesday', label: t.tuesday },
    { value: 'wednesday', label: t.wednesday },
    { value: 'thursday', label: t.thursday },
    { value: 'friday', label: t.friday },
];

interface Props {
    visible: boolean;
    step: SequenceStep | null;
    onSave: (step: SequenceStep) => void;
    onClose: () => void;
    nextStepOrder: number;
}

export default function StepEditorModal({ visible, step, onSave, onClose, nextStepOrder }: Props) {
    const isEditing = !!step;
    const [type, setType] = useState<SequenceStep['type']>('message');
    const [messageContent, setMessageContent] = useState('');
    const [messageContentAr, setMessageContentAr] = useState('');
    const [delayDays, setDelayDays] = useState(0);
    const [sendWindowStartHour, setSendWindowStartHour] = useState(9);
    const [sendWindowStartMinute, setSendWindowStartMinute] = useState(0);
    const [sendWindowEndHour, setSendWindowEndHour] = useState(10);
    const [sendWindowEndMinute, setSendWindowEndMinute] = useState(0);
    const [sendDay, setSendDay] = useState<SendDay[]>(['any']);
    const [isStepActive, setIsStepActive] = useState(true);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [conditionField, setConditionField] = useState('meal_completed_within');
    const [conditionOperator, setConditionOperator] = useState<string>('eq');
    const [conditionValue, setConditionValue] = useState('60');
    const [trueBranch, setTrueBranch] = useState('');
    const [falseBranch, setFalseBranch] = useState('');

    useEffect(() => {
        if (step) {
            setType(step.type);
            setMessageContent(step.messageContent || '');
            setMessageContentAr(step.messageContentAr || '');
            setDelayDays(step.delayDays ?? 0);
            setSendWindowStartHour(step.sendWindowStartHour ?? 9);
            setSendWindowStartMinute(step.sendWindowStartMinute ?? 0);
            setSendWindowEndHour(step.sendWindowEndHour ?? 10);
            setSendWindowEndMinute(step.sendWindowEndMinute ?? 0);
            // Handle both single value and array for sendDay
            const sendDayValue = step.sendDay ?? ['any'];
            setSendDay(Array.isArray(sendDayValue) ? sendDayValue : [sendDayValue]);
            setIsStepActive(step.isActive !== false);
            setConditionField(step.conditionField || 'meal_completed_within');
            setConditionOperator(step.conditionOperator || 'eq');
            setConditionValue(step.conditionValue || '60');
            setTrueBranch(step.trueBranch != null ? String(step.trueBranch) : '');
            setFalseBranch(step.falseBranch != null ? String(step.falseBranch) : '');
        } else {
            setType('message');
            setMessageContent('');
            setMessageContentAr('');
            setDelayDays(0);
            setSendWindowStartHour(9);
            setSendWindowStartMinute(0);
            setSendWindowEndHour(10);
            setSendWindowEndMinute(0);
            setSendDay(['any']);
            setIsStepActive(true);
            setConditionField('meal_completed_within');
            setConditionOperator('eq');
            setConditionValue('60');
            setTrueBranch('');
            setFalseBranch('');
        }
    }, [step, visible]);

    const handleSave = () => {
        const base: SequenceStep = {
            stepOrder: step?.stepOrder ?? nextStepOrder,
            type,
        };

        if (type === 'message') {
            base.messageContent = messageContent;
            base.messageContentAr = messageContentAr;
            base.delayDays = delayDays;
            base.sendWindowStartHour = sendWindowStartHour;
            base.sendWindowStartMinute = sendWindowStartMinute;
            base.sendWindowEndHour = sendWindowEndHour;
            base.sendWindowEndMinute = sendWindowEndMinute;
            base.sendDay = sendDay;
            base.isActive = isStepActive;
        } else if (type === 'condition') {
            base.conditionField = conditionField;
            base.conditionOperator = conditionOperator as any;
            base.conditionValue = conditionValue;
            if (trueBranch) base.trueBranch = parseInt(trueBranch, 10);
            if (falseBranch) base.falseBranch = parseInt(falseBranch, 10);
        }

        onSave(base);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <KeyboardAvoidingView
                style={styles.modalContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>{t.save}</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>
                        {isEditing ? t.editStep : t.addStep}
                    </Text>

                    <TouchableOpacity onPress={onClose} hitSlop={12}>
                        <X size={horizontalScale(24)} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                    {/* Step Type Selector */}
                    <Text style={styles.label}>{t.stepType}</Text>
                    <View style={styles.typeRow}>
                        {STEP_TYPES.map(st => {
                            const Icon = st.icon;
                            const selected = type === st.key;
                            return (
                                <TouchableOpacity
                                    key={st.key}
                                    style={[
                                        styles.typeBtn,
                                        selected && styles.typeBtnSelected,
                                    ]}
                                    onPress={() => setType(st.key)}
                                >
                                    <Icon
                                        size={horizontalScale(20)}
                                        color={selected ? '#FFF' : colors.textSecondary}
                                    />
                                    <Text
                                        style={[
                                            styles.typeBtnText,
                                            selected && styles.typeBtnTextSelected,
                                        ]}
                                    >
                                        {st.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Message fields */}
                    {type === 'message' && (
                        <>
                            {/* Active toggle */}
                            <View style={styles.toggleRow}>
                                <Switch
                                    value={isStepActive}
                                    onValueChange={setIsStepActive}
                                    trackColor={{ true: colors.primaryDark, false: colors.border }}
                                    style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                                />
                                <Text style={styles.toggleLabel}>
                                    {t.stepActive}
                                </Text>
                            </View>

                            {/* Delay Days */}
                            <Text style={styles.label}>{t.delayDays}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.chipRow}>
                                    {DELAY_OPTIONS.map(opt => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            style={[
                                                styles.chip,
                                                delayDays === opt.value && styles.chipSelected,
                                            ]}
                                            onPress={() => setDelayDays(opt.value)}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    delayDays === opt.value && styles.chipTextSelected,
                                                ]}
                                            >
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>

                            {/* Send Window */}
                            <Text style={styles.label}>{t.sendWindow}</Text>
                            <View style={styles.timeRow}>
                                <TouchableOpacity
                                    style={styles.timePickerBtn}
                                    onPress={() => setShowStartTimePicker(!showStartTimePicker)}
                                >
                                    <Clock size={horizontalScale(16)} color={colors.primaryDark} />
                                    <Text style={styles.timePickerText}>
                                        {String(sendWindowStartHour).padStart(2, '0')}:{String(sendWindowStartMinute).padStart(2, '0')}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.timeSeparator}>-</Text>
                                <TouchableOpacity
                                    style={styles.timePickerBtn}
                                    onPress={() => setShowEndTimePicker(!showEndTimePicker)}
                                >
                                    <Clock size={horizontalScale(16)} color={colors.primaryDark} />
                                    <Text style={styles.timePickerText}>
                                        {String(sendWindowEndHour).padStart(2, '0')}:{String(sendWindowEndMinute).padStart(2, '0')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {showStartTimePicker && (
                                <DateTimePicker
                                    value={new Date(2000, 0, 1, sendWindowStartHour, sendWindowStartMinute)}
                                    mode="time"
                                    is24Hour={true}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(_event, date) => {
                                        if (Platform.OS === 'android') {
                                            setShowStartTimePicker(false);
                                        }
                                        if (date) {
                                            setSendWindowStartHour(date.getHours());
                                            setSendWindowStartMinute(date.getMinutes());
                                        }
                                    }}
                                />
                            )}
                            {showEndTimePicker && (
                                <DateTimePicker
                                    value={new Date(2000, 0, 1, sendWindowEndHour, sendWindowEndMinute)}
                                    mode="time"
                                    is24Hour={true}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(_event, date) => {
                                        if (Platform.OS === 'android') {
                                            setShowEndTimePicker(false);
                                        }
                                        if (date) {
                                            setSendWindowEndHour(date.getHours());
                                            setSendWindowEndMinute(date.getMinutes());
                                        }
                                    }}
                                />
                            )}

                            {/* Send Day */}
                            <Text style={styles.label}>{t.sendDay}</Text>
                            <View style={[styles.chipRow, { flexWrap: 'wrap' }]}>
                                { SEND_DAY_OPTIONS.map(opt => {
                                    const isSelected = sendDay.includes(opt.value);
                                    return (
                                        <TouchableOpacity
                                            key={opt.value}
                                            style={[
                                                styles.chip,
                                                isSelected && styles.chipSelected,
                                            ]}
                                            onPress={() => {
                                                if (opt.value === 'any') {
                                                    // If "any" is clicked, select only "any"
                                                    setSendDay(['any']);
                                                } else {
                                                    // Remove "any" if it's selected and add/remove the clicked day
                                                    let newSendDays: SendDay[] = sendDay.filter(d => d !== 'any');
                                                    if (isSelected) {
                                                        // Remove the day
                                                        newSendDays = newSendDays.filter(d => d !== opt.value);
                                                        // If nothing is selected, default to "any"
                                                        if (newSendDays.length === 0) {
                                                            newSendDays = ['any'];
                                                        }
                                                    } else {
                                                        // Add the day
                                                        newSendDays.push(opt.value);
                                                    }
                                                    setSendDay(newSendDays);
                                                }
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    isSelected && styles.chipTextSelected,
                                                ]}
                                            >
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Message Content */}
                            <Text style={styles.label}>{t.messageContent}</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={messageContent}
                                onChangeText={setMessageContent}
                                placeholder={t.messagePlaceholder}
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                textAlignVertical="top"
                            />
                            <Text style={styles.label}>{t.messageContentAr}</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { textAlign: 'right' }]}
                                value={messageContentAr}
                                onChangeText={setMessageContentAr}
                                placeholder={t.messagePlaceholder}
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                textAlignVertical="top"
                            />
                            <View style={styles.previewHint}>
                                <Text style={styles.previewHintText}>{t.previewHint}</Text>
                            </View>
                        </>
                    )}

                    {/* Condition fields */}
                    {type === 'condition' && (
                        <>
                            <Text style={styles.label}>{t.conditionField}</Text>
                            <View style={styles.chipRow}>
                                {CONDITION_FIELDS.map(cf => (
                                    <TouchableOpacity
                                        key={cf.value}
                                        style={[
                                            styles.chip,
                                            conditionField === cf.value && styles.chipSelected,
                                        ]}
                                        onPress={() => setConditionField(cf.value)}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                conditionField === cf.value && styles.chipTextSelected,
                                            ]}
                                        >
                                            {cf.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>{t.conditionOperator}</Text>
                            <View style={styles.chipRow}>
                                {OPERATORS.map(op => (
                                    <TouchableOpacity
                                        key={op.value}
                                        style={[
                                            styles.chip,
                                            conditionOperator === op.value && styles.chipSelected,
                                        ]}
                                        onPress={() => setConditionOperator(op.value)}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                conditionOperator === op.value && styles.chipTextSelected,
                                            ]}
                                        >
                                            {op.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>{t.conditionValue}</Text>
                            <TextInput
                                style={styles.input}
                                value={conditionValue}
                                onChangeText={setConditionValue}
                                placeholder="60"
                                placeholderTextColor={colors.textSecondary}
                            />

                            <Text style={styles.label}>{t.trueBranch}</Text>
                            <TextInput
                                style={styles.input}
                                value={trueBranch}
                                onChangeText={setTrueBranch}
                                keyboardType="number-pad"
                                placeholder="Step order number"
                                placeholderTextColor={colors.textSecondary}
                            />

                            <Text style={styles.label}>{t.falseBranch}</Text>
                            <TextInput
                                style={styles.input}
                                value={falseBranch}
                                onChangeText={setFalseBranch}
                                keyboardType="number-pad"
                                placeholder="Step order number"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </>
                    )}

                    <View style={{ height: verticalScale(40) }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(14),
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
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
    modalBody: {
        flex: 1,
        padding: horizontalScale(16),
    },
    label: {
        fontSize: ScaleFontSize(13),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(8),
        marginTop: verticalScale(16),
        textAlign: 'right',
    },
    typeRow: {
        flexDirection: 'row',
        gap: horizontalScale(10),
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(6),
        paddingVertical: verticalScale(12),
        borderRadius: horizontalScale(12),
        backgroundColor: colors.bgPrimary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    typeBtnSelected: {
        backgroundColor: colors.primaryDark,
        borderColor: colors.primaryDark,
    },
    typeBtnText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    typeBtnTextSelected: {
        color: '#FFF',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(10),
        marginTop: verticalScale(16),
        justifyContent: 'flex-end',
    },
    toggleLabel: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
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
    textArea: {
        minHeight: verticalScale(100),
        textAlignVertical: 'top',
    },
    previewHint: {
        backgroundColor: '#F0F4FF',
        borderRadius: horizontalScale(8),
        padding: horizontalScale(12),
        marginTop: verticalScale(8),
    },
    previewHintText: {
        fontSize: ScaleFontSize(12),
        color: colors.primaryDark,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    timePickerBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        backgroundColor: colors.bgPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: horizontalScale(12),
        paddingVertical: verticalScale(12),
    },
    timePickerText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    timeSeparator: {
        fontSize: ScaleFontSize(20),
        color: colors.textSecondary,
    },
    chipRow: {
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        gap: horizontalScale(8),
    },
    chip: {
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(8),
        backgroundColor: colors.bgPrimary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipSelected: {
        backgroundColor: colors.primaryDark,
        borderColor: colors.primaryDark,
    },
    chipText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    chipTextSelected: {
        color: '#FFF',
    },
});

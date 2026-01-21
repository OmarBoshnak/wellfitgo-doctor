import { colors, shadows } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { ScaleFontSize } from '@/src/core/utils/scaling';
import { Meal } from '@/src/types/meals';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface MealCardProps {
    meal: Meal;
    onSelectOption: (mealId: string, categoryId: string, optionId: string) => void;
    onOpenBottomSheet: (mealId: string, categoryId: string) => void;
    onCompleteMeal: (mealId: string) => void;
    onChangeMeal: (mealId: string) => void;
    isReadyToComplete: boolean;
    summary: string[];
    onRequestChange: () => void;
}

export const MealCard: React.FC<MealCardProps> = ({
    meal,
    onSelectOption,
    onOpenBottomSheet,
    onCompleteMeal,
    onChangeMeal,
    isReadyToComplete,
    summary,
    onRequestChange,
}) => {
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId],
        }));
    };

    // Completed State
    if (meal.completed) {
        return (
            <View style={[
                styles.mealCard,
                styles.mealCardCompleted,
                { borderLeftWidth: isRTL ? 0 : 4, borderRightWidth: isRTL ? 4 : 0 },
            ]}>
                <View style={[styles.mealHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={[styles.mealInfo, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                        <Text style={[styles.mealName, isRTL && styles.textRTL]}>
                            {isRTL ? meal.nameAr : meal.name}
                        </Text>
                    </View>
                    <View style={[styles.completedBadge, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.completedCheck}><Ionicons name='checkmark-circle-sharp' size={20} color={colors.success} /></Text>
                        <Text style={styles.completedText}>{isRTL ? 'تم' : 'Done'}</Text>
                    </View>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={[styles.summaryLabel, isRTL && styles.textRTL]}>
                        {isRTL ? 'ما أكلته:' : 'What I ate:'}
                    </Text>
                    {summary.map((item, i) => (
                        <View key={i} style={[styles.summaryItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text style={styles.bulletPoint}>•</Text>
                            <Text style={[styles.summaryText, isRTL && styles.textRTL]}>{item}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.changeChoicesButton}
                    onPress={() => onChangeMeal(meal.id)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.changeChoicesText}>
                        {isRTL ? 'تغيير اختياراتي' : 'Change My Choices'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Active State
    return (
        <View style={styles.mealCard}>
            <View style={[styles.mealHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={[styles.mealInfo, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                    <Text style={[styles.mealName, isRTL && styles.textRTL]}>
                        {isRTL ? meal.nameAr : meal.name}
                    </Text>
                </View>
                <TouchableOpacity onPress={onRequestChange} style={styles.moreButton}>
                    <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={styles.categoriesContainer}>
                {meal.categories.map((category) => {
                    const hasSelection = category.options.some(opt => opt.selected);
                    const isExpanded = expandedCategories[category.id] || false;
                    const visibleOptions = isExpanded ? category.options : category.options.slice(0, 3);
                    const hasMore = category.options.length > 3;

                    return (
                        <View key={category.id} style={styles.categoryContainer}>
                            <View style={[styles.categoryHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={[styles.categoryTitleRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                    {category.emoji ? <Text style={styles.categoryEmoji}>{category.emoji}</Text> : null}
                                    <Text style={styles.categoryName}>
                                        {isRTL ? category.nameAr : category.name}
                                    </Text>
                                    {hasSelection && <Text style={styles.selectionCheck}>✓</Text>}
                                </View>
                                {hasMore && !isExpanded && (
                                    <TouchableOpacity onPress={() => toggleCategory(category.id)}>
                                        <Text style={styles.moreOptionsText}>
                                            {isRTL ? `+${category.options.length - 3} المزيد` : `+${category.options.length - 3} more`}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.optionsContainer}>
                                {visibleOptions.map((option, i) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={[
                                            styles.optionButton,
                                            option.selected && styles.optionButtonSelected,
                                            i < visibleOptions.length - 1 && styles.optionBorder,
                                            { flexDirection: isRTL ? 'row' : 'row-reverse' },
                                        ]}
                                        onPress={() => onSelectOption(meal.id, category.id, option.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.radioOuter, option.selected && styles.radioOuterSelected]}>
                                            {option.selected && <View style={styles.radioInner} />}
                                        </View>
                                        <Text style={[styles.optionText, isRTL && styles.textRTL]}>{option.text}</Text>
                                        {option.selected && <Text style={styles.optionCheckmark}>✓</Text>}
                                    </TouchableOpacity>
                                ))}

                                {isExpanded && hasMore && (
                                    <TouchableOpacity
                                        style={styles.showLessButton}
                                        onPress={() => toggleCategory(category.id)}
                                    >
                                        <Text style={styles.showLessText}>
                                            {isRTL ? 'عرض أقل' : 'Show less'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Tap to see all options */}
                            {!isExpanded && hasMore && (
                                <TouchableOpacity
                                    style={styles.seeAllButton}
                                    onPress={() => onOpenBottomSheet(meal.id, category.id)}
                                >
                                    <Text style={styles.seeAllText}>
                                        {isRTL ? 'انقر لرؤية جميع الخيارات' : 'Tap to see all options'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Complete Button */}
            <TouchableOpacity
                style={[
                    styles.completeButton,
                    !isReadyToComplete && styles.completeButtonDisabled,
                ]}
                onPress={() => isReadyToComplete && onCompleteMeal(meal.id)}
                disabled={!isReadyToComplete}
                activeOpacity={0.7}
            >
                <Text style={styles.completeButtonText}>
                    {isRTL ? 'أكلت هذا' : 'I Ate This'}
                </Text>
            </TouchableOpacity>

            {!isReadyToComplete && (
                <Text style={styles.selectHint}>
                    {isRTL ? 'اختر من كل فئة أولاً' : 'Select your choices first'}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    mealCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        ...shadows.light,
    },
    mealCardCompleted: {
        borderColor: colors.success,
    },
    mealHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    mealInfo: {
        alignItems: 'center',
        gap: 10,
    },
    mealEmoji: {
        alignItems: 'center',
        fontSize: 20,
    },
    mealName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    mealTime: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    textRTL: {
        textAlign: 'left',
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    completedCheck: {
        fontSize: 16,
    },
    completedText: {
        fontSize: ScaleFontSize(12),
        color: colors.success,
        fontWeight: '600',
    },
    moreButton: {
        padding: 4,
    },

    // Summary (completed state)
    summaryCard: {
        backgroundColor: colors.bgSecondary,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginBottom: 8,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 4,
    },
    bulletPoint: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    summaryText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        flex: 1,
    },
    changeChoicesButton: {
        borderWidth: 2,
        borderColor: colors.border,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    changeChoicesText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textSecondary,
    },

    // Categories
    categoriesContainer: {
        gap: 12,
        marginBottom: 16,
    },
    categoryContainer: {},
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    categoryTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    categoryEmoji: {
        fontSize: 18,
    },
    categoryName: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.primaryDark,
    },
    selectionCheck: {
        fontSize: 14,
        color: colors.success,
    },
    moreOptionsText: {
        fontSize: ScaleFontSize(12),
        color: colors.primaryDark,
        fontWeight: '600',
    },
    optionsContainer: {
        backgroundColor: colors.bgSecondary,
        borderRadius: 12,
        overflow: 'hidden',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
    },
    optionButtonSelected: {
        backgroundColor: 'rgba(76, 175, 80, 0.08)',
    },
    optionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: colors.primaryDark,
        backgroundColor: colors.primaryDark,
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.white,
    },
    optionText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        flex: 1,
    },
    optionCheckmark: {
        fontSize: 16,
        color: colors.success,
    },
    showLessButton: {
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
    },
    showLessText: {
        fontSize: ScaleFontSize(12),
        color: colors.primaryDark,
        fontWeight: '600',
    },
    seeAllButton: {
        padding: 8,
        alignItems: 'center',
        marginTop: 4,
    },
    seeAllText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },

    // Complete Button
    completeButton: {
        backgroundColor: colors.success,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completeButtonDisabled: {
        backgroundColor: colors.border,
        opacity: 0.5,
    },
    completeButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.white,
    },
    selectHint: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
});

export default MealCard;

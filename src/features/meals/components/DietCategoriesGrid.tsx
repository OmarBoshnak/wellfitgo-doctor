import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Stethoscope, Clock, Activity, Trash2, Utensils, Search, X, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, gradients } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { useDietCategories, type DietCategory } from '../hooks/useDietCategories';
import { usePlanMutations } from '../hooks/usePlanMutations';
import { plansService } from '@/src/shared/services';


const t = {
    categories: isRTL ? 'الفئات' : 'CATEGORIES',
    chooseCategory: isRTL ? 'اختر فئة النظام الغذائي' : 'Choose a diet category',
    programs: isRTL ? 'برامج' : 'programs',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    noCategories: isRTL ? 'لا توجد فئات' : 'No categories found',
    createFirst: isRTL ? 'أنشئ نظامًا غذائيًا للبدء' : 'Create a diet plan to get started',
    deleteError: isRTL ? 'فشل في حذف الفئة' : 'Failed to delete category',
    search: isRTL ? 'بحث' : 'Search',
    searchDiets: isRTL ? 'ابحث عن الأنظمة الغذائية' : 'Search Diets',
    searchPlaceholder: isRTL ? 'ابحث بالاسم أو السعرات...' : 'Search by name or calories...',
    noResults: isRTL ? 'لا توجد نتائج' : 'No results found',
    calories: isRTL ? 'سعرة' : 'cal',
};

// Icon mapping for special categories that use icons instead of emoji
const ICON_CATEGORIES: Record<string, 'medical' | 'clock' | 'glucose'> = {
    medical: 'medical',
    intermittent_fasting: 'clock',
};

// Search result type
interface SearchResult {
    id: string;
    name: string;
    nameAr?: string;
    emoji?: string;
    targetCalories?: number;
    type: string;
}

interface Props {
    categories?: DietCategory[];
    onCategoryPress?: (category: DietCategory) => void;
    onCreateCustom?: () => void;
    onDeleteCategory?: (categoryId: string) => void;
    showHeader?: boolean;
}

export default function DietCategoriesGrid({
    categories: propCategories,
    onCategoryPress,
    onCreateCustom,
    onDeleteCategory,
    showHeader = true
}: Props) {
    // ============ NAVIGATION ============
    const router = useRouter();

    // ============ SEARCH STATE ============
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[] | undefined>(undefined);
    const [isSearching, setIsSearching] = useState(false);

    // ============ DATA FROM HOOKS ============
    const { categories: hookCategories, isLoading: hookLoading, refetch } = useDietCategories();

    // Use props if provided, otherwise use hook data
    const categories = propCategories ?? hookCategories;
    const isLoading = propCategories ? false : hookLoading;
    const { deleteDietCategory } = usePlanMutations();



    // Notify parent when loading completes

    // Search effect - debounced search when query changes
    useEffect(() => {
        if (!showSearchModal || searchQuery.trim().length < 1) {
            setSearchResults(undefined);
            return;
        }

        const searchPlans = async () => {
            setIsSearching(true);
            try {
                const results = await plansService.searchDietPlans(searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error('Error searching plans:', error);
                setSearchResults([]);
            }
            setIsSearching(false);
        };

        // Debounce search
        const timer = setTimeout(searchPlans, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, showSearchModal]);

    // ============ DELETE HANDLER ============
    const handleDeleteCategory = async (categoryId: string) => {
        try {
            await deleteDietCategory(categoryId);
            onDeleteCategory?.(categoryId);
        } catch (error) {
            console.error('Failed to delete category:', error);
            Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                t.deleteError
            );
        }
    };

    // ============ NAVIGATION HANDLERS ============
    const handleCategoryPressInternal = (category: DietCategory) => {
        if (onCategoryPress) {
            onCategoryPress(category);
            return;
        }

        router.push({
            pathname: '/doctor/diet-plans',
            params: {
                categoryId: category.id,
                categoryName: category.name,
                categoryNameAr: category.nameAr,
                categoryEmoji: category.emoji ?? '',
            },
        });
    };

    const handleDietPress = useCallback((diet: { id: string; name: string; targetCalories?: number }) => {
        setShowSearchModal(false);
        setSearchQuery('');
        router.push({
            pathname: '/doctor/diet-details',
            params: {
                dietId: diet.id,
            },
        });
    }, [router]);

    const renderIcon = (category: DietCategory) => {
        // Check if this category should use an icon instead of emoji
        const iconType = ICON_CATEGORIES[category.id];

        if (iconType) {
            const iconProps = {
                size: horizontalScale(32),
                color: colors.textPrimary,
                strokeWidth: 1.5,
            };

            switch (iconType) {
                case 'medical':
                    return <Stethoscope {...iconProps} />;
                case 'clock':
                    return <Clock {...iconProps} />;
                case 'glucose':
                    return <Activity {...iconProps} />;
                default:
                    return null;
            }
        }

        // Use emoji if available
        if (category.emoji) {
            return <Text style={styles.categoryEmoji}>{category.emoji}</Text>;
        }

        // Fallback icon
        return <Utensils size={horizontalScale(32)} color={colors.textPrimary} strokeWidth={1.5} />;
    };

    // ============ SEARCH MODAL ============
    const renderSearchModal = () => (
        <Modal
            visible={showSearchModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => {
                setShowSearchModal(false);
                setSearchQuery('');
            }}
        >
            <View style={styles.searchModalContainer}>
                {/* Search Header */}
                <View style={[styles.searchHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity
                        onPress={() => {
                            setShowSearchModal(false);
                            setSearchQuery('');
                        }}
                        style={styles.closeButton}
                    >
                        <X size={horizontalScale(24)} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.searchTitle}>{t.searchDiets}</Text>
                    <View style={{ width: horizontalScale(40) }} />
                </View>

                {/* Search Input */}
                <View style={styles.searchInputContainer}>
                    <Search size={horizontalScale(20)} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
                        placeholder={t.searchPlaceholder}
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={horizontalScale(18)} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Search Results */}
                <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
                    {searchQuery.trim().length === 0 ? (
                        <View style={styles.searchEmptyState}>
                            <Search size={horizontalScale(48)} color={colors.textSecondary} />
                            <Text style={styles.searchEmptyText}>{t.searchPlaceholder}</Text>
                        </View>
                    ) : searchResults === undefined ? (
                        <View style={styles.searchLoadingState}>
                            <ActivityIndicator size="small" color={colors.primaryDark} />
                        </View>
                    ) : searchResults.length === 0 ? (
                        <View style={styles.searchEmptyState}>
                            <Text style={styles.noResultsEmoji}>🔍</Text>
                            <Text style={styles.noResultsText}>{t.noResults}</Text>
                        </View>
                    ) : (
                        (searchResults as SearchResult[]).map((diet: SearchResult) => (
                            <TouchableOpacity
                                key={diet.id}
                                style={[styles.searchResultItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                                onPress={() => handleDietPress(diet)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.searchResultIcon}>
                                    <Text style={styles.searchResultEmoji}>{diet.emoji || '🥗'}</Text>
                                </View>
                                <View style={[styles.searchResultInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                                    <Text style={[styles.searchResultName, { textAlign: isRTL ? 'right' : 'left' }]}>
                                        {diet.name}
                                    </Text>
                                    {diet.targetCalories && (
                                        <Text style={styles.searchResultCalories}>
                                            {diet.targetCalories} {t.calories}
                                        </Text>
                                    )}
                                </View>
                                {isRTL ? (
                                    <ChevronLeft size={horizontalScale(20)} color={colors.textSecondary} />
                                ) : (
                                    <ChevronRight size={horizontalScale(20)} color={colors.textSecondary} />
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </View>
        </Modal>
    );

    const renderHeader = () => (
        <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <View style={[styles.headerButtons, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                {/* Search Button */}
                <TouchableOpacity
                    onPress={() => setShowSearchModal(true)}
                    activeOpacity={0.9}
                    style={styles.searchButton}
                >
                    <Search size={horizontalScale(22)} color={colors.primaryDark} strokeWidth={2} />
                </TouchableOpacity>

                {/* Add Button - Only show if handler provided */}
                {onCreateCustom && (
                    <TouchableOpacity onPress={onCreateCustom} activeOpacity={0.9}>
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.addButton}
                        >
                            <Plus size={horizontalScale(22)} color="#FFFFFF" strokeWidth={2.5} />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={styles.headerLabel}>{t.categories}</Text>
                <Text style={styles.headerText}>{t.chooseCategory}</Text>
            </View>

        </View>
    );

    const renderLoadingState = () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryDark} />
            <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>{t.noCategories}</Text>
            <Text style={styles.emptyText}>{t.createFirst}</Text>
        </View>
    );

    const renderCategoryCard = (category: DietCategory) => {
        // Debug log to check category data
        console.log('Category Debug:', {
            name: category.name,
            type: category.type,
            id: category.id,
            isCustom: category.type === 'custom'
        });

        return (
            <View key={category.id} style={category.type === 'custom' ? styles.customCategoryWrapper : undefined}>
                <TouchableOpacity
                    style={[styles.categoryCard, category.type === 'custom' && styles.customCategoryCard]}
                    onPress={() => handleCategoryPressInternal(category)}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconContainer}>
                        {renderIcon(category)}
                    </View>
                    <View style={styles.categoryInfo}>
                        {category.type === 'custom' ? (
                            <View style={[styles.categoryNameRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={styles.customBadge}>
                                    <Text style={styles.customBadgeText}>{isRTL ? 'مخصص' : 'Custom'}</Text>
                                </View>
                                <Text style={styles.categoryName}>{category.name}</Text>
                            </View>
                        ) : (
                            <Text style={styles.categoryName}>{category.name}</Text>
                        )}
                        <View style={[styles.categoryMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text style={styles.categoryNameAr}>{category.nameAr}</Text>
                            <View style={styles.dotSeparator} />
                            <Text style={styles.categoryCount}>{category.dietCount || 0} {t.programs}</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Delete Button for Non-System Categories */}
                {(() => {
                    const shouldShowDelete = category.type !== 'system';
                    console.log(`Delete button for "${category.name}":`, {
                        shouldShow: shouldShowDelete,
                        categoryType: category.type,
                        categoryId: category.id
                    });
                    return shouldShowDelete;
                })() && (
                        <TouchableOpacity
                            style={[styles.deleteButton, { [isRTL ? 'left' : 'right']: horizontalScale(8) }]}
                            onPress={() => {
                                Alert.alert(
                                    isRTL ? 'حذف الفئة' : 'Delete Category',
                                    isRTL ? `هل تريد حذف "${category.name}"؟` : `Delete "${category.name}"?`,
                                    [
                                        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                                        {
                                            text: isRTL ? 'حذف' : 'Delete',
                                            style: 'destructive',
                                            onPress: () => handleDeleteCategory(category._id || category.id)
                                        },
                                    ]
                                );
                            }}
                        >
                            <Trash2 size={horizontalScale(16)} color="#EB5757" />
                        </TouchableOpacity>
                    )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {showHeader && renderHeader()}
            {renderSearchModal()}

            {isLoading && (!categories || categories.length === 0) ? (
                renderLoadingState()
            ) : (
                <View style={styles.listContent}>
                    {/* All Categories from Mongdb (including custom) */}
                    {categories && categories.length > 0 ? (
                        categories.map((category) => renderCategoryCard(category))
                    ) : (
                        renderEmptyState()
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        gap: verticalScale(12),
    },
    // Header
    header: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(20),
    },
    headerLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '700',
        color: '#AAB8C5',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: verticalScale(4),
    },
    headerText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    addButton: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(24),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    // Category Card
    categoryCard: {
        height: verticalScale(120),
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },
    iconContainer: {
        marginBottom: verticalScale(8),
    },
    categoryEmoji: {
        fontSize: ScaleFontSize(32),
    },
    categoryInfo: {
        alignItems: 'center',
    },
    categoryName: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(4),
    },
    categoryMeta: {
        alignItems: 'center',
        gap: horizontalScale(6),
    },
    categoryNameAr: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    dotSeparator: {
        width: horizontalScale(4),
        height: horizontalScale(4),
        borderRadius: horizontalScale(2),
        backgroundColor: colors.textSecondary,
    },
    categoryCount: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    // Custom Category Styles
    customCategoryCard: {
        borderWidth: 2,
        borderColor: colors.primaryDark,
        borderStyle: 'dashed',
    },
    categoryNameRow: {
        alignItems: 'center',
        gap: horizontalScale(8),
        marginBottom: verticalScale(4),
    },
    customBadge: {
        backgroundColor: 'rgba(80, 115, 254, 0.1)',
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(2),
        borderRadius: horizontalScale(4),
    },
    customBadgeText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '600',
        color: colors.primaryDark,
    },
    customCategoryWrapper: {
        position: 'relative',
    },
    deleteButton: {
        position: 'absolute',
        top: verticalScale(8),
        backgroundColor: 'rgba(235, 87, 87, 0.1)',
        padding: horizontalScale(8),
        borderRadius: horizontalScale(20),
        zIndex: 10,
    },
    // Loading State
    loadingContainer: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(32),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: verticalScale(200),
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginTop: verticalScale(12),
    },
    // Empty State
    emptyContainer: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(32),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: verticalScale(200),
    },
    emptyEmoji: {
        fontSize: ScaleFontSize(48),
        marginBottom: verticalScale(16),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(8),
    },
    emptyText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'center',
    },
    // Header Buttons
    headerButtons: {
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    searchButton: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(24),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(80, 115, 254, 0.1)',
    },
    // Search Modal
    searchModalContainer: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: horizontalScale(16),
    },
    searchHeader: {
        paddingVertical: verticalScale(16),
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    closeButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgPrimary,
        marginVertical: verticalScale(16),
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        borderRadius: horizontalScale(12),
        gap: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: ScaleFontSize(16),
        color: colors.textPrimary,
    },
    searchResults: {
        flex: 1,
    },
    searchEmptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(60),
        gap: verticalScale(16),
    },
    searchEmptyText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    searchLoadingState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(40),
    },
    noResultsEmoji: {
        fontSize: ScaleFontSize(48),
    },
    noResultsText: {
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
    },
    searchResultItem: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(16),
        marginBottom: verticalScale(12),
        alignItems: 'center',
        gap: horizontalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    searchResultIcon: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(24),
        backgroundColor: 'rgba(80, 115, 254, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchResultEmoji: {
        fontSize: ScaleFontSize(24),
    },
    searchResultInfo: {
        flex: 1,
    },
    searchResultName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(2),
    },
    searchResultCalories: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
});

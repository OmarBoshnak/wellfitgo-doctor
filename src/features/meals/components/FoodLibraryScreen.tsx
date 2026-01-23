import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowLeft,
    ArrowRight,
    Search,
    Plus,
    Check,
    X,
    AlertCircle,
} from 'lucide-react-native';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { isRTL } from '@/src/core/constants/translation';
import { colors, gradients } from '@/src/core/constants/Theme';
import { useFoods, useCommonlyUsedFoods, useCreateCustomFood, Food } from '../hooks/useFoods';

// ============ TRANSLATIONS ============
const t = {
    addFood: isRTL ? 'إضافة طعام' : 'Add Food',
    done: isRTL ? 'تم' : 'Done',
    searchPlaceholder: isRTL ? 'ابحث بالعربية أو الإنجليزية...' : 'Search foods in Arabic or English...',
    commonlyUsed: isRTL ? 'الأكثر استخداماً' : 'COMMONLY USED',
    recentlyAdded: isRTL ? 'أضيفت مؤخراً' : 'RECENTLY ADDED',
    allFoods: isRTL ? 'جميع الأطعمة' : 'ALL FOODS',
    createCustomFood: isRTL ? 'إنشاء طعام مخصص' : 'Create Custom Food',
    // Filter tabs
    all: isRTL ? 'الكل' : 'All',
    carbs: isRTL ? 'نشويات' : 'Carbs',
    protein: isRTL ? 'بروتين' : 'Protein',
    vegetables: isRTL ? 'خضروات' : 'Vegetables',
    fruits: isRTL ? 'فواكه' : 'Fruits',
    dairy: isRTL ? 'ألبان' : 'Dairy',
    fats: isRTL ? 'دهون' : 'Fats',
    snacks: isRTL ? 'وجبات خفيفة' : 'Snacks',
    cal: isRTL ? 'سعرة' : 'cal',
    // Create Custom Food Modal
    foodName: 'اسم الطعام',
    enterFoodName: 'أدخل اسم الطعام',
    selectCategory: 'اختر التصنيف',
    calories: isRTL ? 'السعرات الحرارية (اختياري)' : 'Calories (optional)',
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    add: isRTL ? 'إضافة' : 'Add',
    enterCalories: isRTL ? 'أدخل السعرات' : 'Enter calories',
    // Loading and Error states
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    noFoodsFound: isRTL ? 'لم يتم العثور على أطعمة' : 'No foods found',
    tryDifferentSearch: isRTL ? 'جرب البحث بكلمة مختلفة' : 'Try a different search term',
    offline: isRTL ? 'أنت غير متصل بالإنترنت' : 'You are offline',
    offlineMessage: isRTL ? 'سيتم تحميل البيانات عند الاتصال' : 'Data will load when connected',
    creating: isRTL ? 'جاري الإنشاء...' : 'Creating...',
    categoryRequired: 'يجب اختيار التصنيف',
};

// ============ TYPES ============
interface FoodItem {
    id: string;
    nameAr: string;
    nameEn: string;
    calories: number;
    category: string;
}

interface Props {
    onBack: () => void;
    onSelectFoods: (foods: FoodItem[]) => void;
    categoryName?: string;
}

const FILTER_TABS = [
    { id: 'all', label: t.all },
    { id: 'carbs', label: t.carbs },
    { id: 'protein', label: t.protein },
    { id: 'vegetables', label: t.vegetables },
    { id: 'fruits', label: t.fruits },
    { id: 'dairy', label: t.dairy },
    { id: 'fats', label: t.fats },
    { id: 'snacks', label: t.snacks },
];

// ============ FOOD ITEM COMPONENT ============
interface FoodItemRowProps {
    item: FoodItem;
    isSelected: boolean;
    onToggle: () => void;
}

const FoodItemRow = ({ item, isSelected, onToggle }: FoodItemRowProps) => (
    <TouchableOpacity
        style={styles.foodItemRow}
        onPress={onToggle}
        activeOpacity={0.7}
    >
        {/* Checkbox */}
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Check size={horizontalScale(14)} color="#FFFFFF" />}
        </View>

        {/* Calories */}
        <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesText}>{item.calories} {t.cal}</Text>
        </View>
        {/* Food Info */}
        <View style={styles.foodInfo}>
            <Text style={styles.foodNameAr}>{item.nameAr}</Text>
            <Text style={styles.foodNameEn}>{item.nameEn}</Text>
        </View>

    </TouchableOpacity>
);

// ============ LOADING SKELETON ============
const LoadingSkeleton = () => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
        <Text style={styles.loadingText}>{t.loading}</Text>
    </View>
);

// ============ EMPTY STATE ============
const EmptyState = ({ searchQuery }: { searchQuery: string }) => (
    <View style={styles.emptyContainer}>
        <Search size={horizontalScale(48)} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>{t.noFoodsFound}</Text>
        {searchQuery.trim() && (
            <Text style={styles.emptySubtitle}>{t.tryDifferentSearch}</Text>
        )}
    </View>
);

// ============ OFFLINE STATE ============
const OfflineState = () => (
    <View style={styles.emptyContainer}>
        <AlertCircle size={horizontalScale(48)} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>{t.offline}</Text>
        <Text style={styles.emptySubtitle}>{t.offlineMessage}</Text>
    </View>
);

// ============ MAIN COMPONENT ============
export default function FoodLibraryScreen({ onBack, onSelectFoods, categoryName }: Props) {
    const insets = useSafeAreaInsets();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());

    // Create Custom Food Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFoodName, setNewFoodName] = useState('');
    const [newFoodCategory, setNewFoodCategory] = useState<string | null>(null);
    const [newFoodCalories, setNewFoodCalories] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Debounce search to avoid extra network calls
    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 250);
        return () => clearTimeout(id);
    }, [searchQuery]);



    // Fetch with server-side filtering to reduce payload (category + debounced search)
    const categoryFilter = activeFilter === 'all' ? undefined : activeFilter;
    const {
        foods,
        isLoading,
        isLoadingMore,
        hasMore,
        fetchMore,
    } = useFoods(categoryFilter, debouncedSearchQuery || undefined, 20);

    const commonlyUsedList = useCommonlyUsedFoods();
    const createCustomFood = useCreateCustomFood();

    // Transform Convex foods to FoodItem format
    const allFoods: FoodItem[] = useMemo(() => {
        // ...
        const source = foods || [];
        let filtered = source;

        // 1. Client-side Search Filtering
        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase();
            filtered = filtered.filter((f: { nameAr: string; nameEn: string; }) =>
                f.nameAr.toLowerCase().includes(query) ||
                f.nameEn.toLowerCase().includes(query)
            );
        }

        // 2. Client-side Category Filtering
        if (categoryFilter) {
            filtered = filtered.filter((f: { category: string; }) => f.category === categoryFilter);
        }

        // 3. Deduplicate by id to avoid duplicate keys when paging overlaps
        const seen = new Set<string>();
        const uniqueItems: FoodItem[] = [];
        filtered.forEach((f: Food) => {
            if (!seen.has(f._id)) {
                seen.add(f._id);
                uniqueItems.push({
                    id: f._id,
                    nameAr: f.nameAr,
                    nameEn: f.nameEn,
                    calories: f.calories,
                    category: f.category,
                });
            }
        });

        return uniqueItems;
    }, [foods, debouncedSearchQuery, categoryFilter]);

    // Get commonly used foods
    const commonlyUsed: FoodItem[] = useMemo(() => {
        if (!commonlyUsedList) return [];

        // If there's a search or filter, show from filtered results
        if (debouncedSearchQuery || categoryFilter) {
            return allFoods.slice(0, 2);
        }

        // Otherwise show commonly used
        return commonlyUsedList.slice(0, 5).map((f: Food) => ({
            id: f._id,
            nameAr: f.nameAr,
            nameEn: f.nameEn,
            calories: f.calories,
            category: f.category,
        }));
    }, [commonlyUsedList, allFoods, searchQuery, activeFilter]);

    // Get rest of foods for "All Foods" section
    const allFoodsSection: FoodItem[] = useMemo(() => {
        if (!foods) return []; // Check against raw foods for loading state

        // If there's a search or filter active, skip commonly used section logic somewhat
        // Actually, logic is: allFoods contains the filtered list.
        // We just need to exclude the ones shown in commonlyUsed.

        const commonlyUsedIds = new Set(commonlyUsed.map(f => f.id));
        return allFoods.filter(f => !commonlyUsedIds.has(f.id));
    }, [allFoods, commonlyUsed, foods]);

    // Toggle food selection
    const toggleFood = useCallback((foodId: string) => {
        setSelectedFoods(prev => {
            const newSet = new Set(prev);
            if (newSet.has(foodId)) {
                newSet.delete(foodId);
            } else {
                newSet.add(foodId);
            }
            return newSet;
        });
    }, []);

    // Handle done
    const handleDone = useCallback(() => {
        const selected = allFoods.filter(f => selectedFoods.has(f.id));
        onSelectFoods(selected);
    }, [selectedFoods, onSelectFoods, allFoods]);

    // Handle create custom food
    const handleCreateCustomFood = useCallback(async () => {
        if (!newFoodName.trim()) return;
        if (!newFoodCategory) return; // Category is required

        setIsCreating(true);
        try {
            const newFoodId = await createCustomFood({
                nameAr: newFoodName.trim(),
                nameEn: newFoodName.trim(), // Use same name for both
                calories: newFoodCalories ? parseInt(newFoodCalories, 10) : 0,
                category: newFoodCategory as any,
            });

            // Auto-select the new food
            if (newFoodId) {
                setSelectedFoods(prev => {
                    const newSet = new Set(prev);
                    newSet.add(newFoodId);
                    return newSet;
                });
            }

            // Reset modal
            setNewFoodName('');
            setNewFoodCategory(null);
            setNewFoodCalories('');
            setShowCreateModal(false);
        } catch (error) {
            console.error('Failed to create custom food:', error);
        } finally {
            setIsCreating(false);
        }
    }, [newFoodName, newFoodCategory, newFoodCalories, createCustomFood]);

    // Back arrow based on RTL
    const BackArrow = () => isRTL
        ? <ArrowLeft size={horizontalScale(24)} color={colors.textPrimary} />
        : <ArrowRight size={horizontalScale(24)} color={colors.textPrimary} />;

    // Determine loading state
    const isEmpty = !isLoading && allFoods.length === 0;

    const handleScroll = useCallback(({ nativeEvent }: { nativeEvent: any }) => {
        const paddingToBottom = 120;
        if (nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - paddingToBottom) {
            fetchMore();
        }
    }, [fetchMore]);

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <BackArrow />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t.addFood}</Text>
                <TouchableOpacity onPress={handleDone} activeOpacity={0.9}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.doneButton}
                    >
                        <Text style={styles.doneButtonText}>
                            {t.done} ({selectedFoods.size})
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t.searchPlaceholder}
                        placeholderTextColor={`${colors.primaryDark}99`}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <Search size={horizontalScale(20)} color={colors.primaryDark} style={styles.searchIcon} />
                </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}
                >
                    {FILTER_TABS.map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => setActiveFilter(tab.id)}
                            activeOpacity={0.8}
                        >
                            {activeFilter === tab.id ? (
                                <LinearGradient
                                    colors={gradients.primary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.filterTabActive}
                                >
                                    <Text style={styles.filterTabActiveText}>{tab.label}</Text>
                                </LinearGradient>
                            ) : (
                                <View style={styles.filterTabInactive}>
                                    <Text style={styles.filterTabInactiveText}>{tab.label}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Food List */}
            {isLoading ? (
                <LoadingSkeleton />
            ) : isEmpty ? (
                <EmptyState searchQuery={searchQuery} />
            ) : (
                <ScrollView
                    style={styles.listContainer}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                >
                    {/* Commonly Used Section */}
                    {commonlyUsed.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>{t.commonlyUsed}</Text>
                            {commonlyUsed.map(item => (
                                <FoodItemRow
                                    key={item.id}
                                    item={item}
                                    isSelected={selectedFoods.has(item.id)}
                                    onToggle={() => toggleFood(item.id)}
                                />
                            ))}
                        </>
                    )}

                    {/* All Foods Section */}
                    {allFoodsSection.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, { marginTop: verticalScale(16) }]}>
                                {t.allFoods}
                            </Text>
                            {allFoodsSection.map(item => (
                                <FoodItemRow
                                    key={item.id}
                                    item={item}
                                    isSelected={selectedFoods.has(item.id)}
                                    onToggle={() => toggleFood(item.id)}
                                />
                            ))}
                            {hasMore && (
                                <View style={{ paddingVertical: verticalScale(16), alignItems: 'center' }}>
                                    {isLoadingMore ? (
                                        <ActivityIndicator size="small" color={colors.primaryDark} />
                                    ) : (
                                        <TouchableOpacity onPress={fetchMore} style={{ padding: 8 }}>
                                            <Text style={{ color: colors.primaryDark }}>
                                                {isRTL ? 'تحميل المزيد' : 'Load more'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </>
                    )}

                    {/* Bottom spacing */}
                    <View style={{ height: verticalScale(100) }} />
                </ScrollView>
            )}

            {/* Floating Create Button */}
            <View style={[styles.floatingButtonContainer, { paddingBottom: insets.bottom }]}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => setShowCreateModal(true)}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.floatingButton}
                    >
                        <Plus size={horizontalScale(20)} color="#FFFFFF" />
                        <Text style={styles.floatingButtonText}>{t.createCustomFood}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Create Custom Food Modal */}
            <Modal
                visible={showCreateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContainer}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t.createCustomFood}</Text>
                            <TouchableOpacity
                                onPress={() => setShowCreateModal(false)}
                                style={styles.modalCloseButton}
                            >
                                <X size={horizontalScale(20)} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Input Fields */}
                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalInputLabel}>{t.foodName}</Text>
                            <TextInput
                                style={[styles.modalInput, { textAlign: 'right' }]}
                                value={newFoodName}
                                onChangeText={setNewFoodName}
                                placeholder={t.enterFoodName}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* Category Selection */}
                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalInputLabel}>{t.selectCategory}</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.categoryScrollContent}
                            >
                                {FILTER_TABS.filter(tab => tab.id !== 'all').map(tab => (
                                    <TouchableOpacity
                                        key={tab.id}
                                        onPress={() => setNewFoodCategory(tab.id)}
                                        activeOpacity={0.8}
                                    >
                                        {newFoodCategory === tab.id ? (
                                            <LinearGradient
                                                colors={gradients.primary}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.categoryChipActive}
                                            >
                                                <Text style={styles.categoryChipActiveText}>{tab.label}</Text>
                                            </LinearGradient>
                                        ) : (
                                            <View style={styles.categoryChipInactive}>
                                                <Text style={styles.categoryChipInactiveText}>{tab.label}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Optional Calories */}
                        <View style={styles.modalInputGroup}>
                            <Text style={styles.modalInputLabel}>{t.calories}</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={newFoodCalories}
                                onChangeText={setNewFoodCalories}
                                placeholder={t.enterCalories}
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Modal Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowCreateModal(false)}
                                disabled={isCreating}
                            >
                                <Text style={styles.modalCancelText}>{t.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCreateCustomFood} disabled={isCreating}>
                                <LinearGradient
                                    colors={gradients.primary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.modalConfirmButton, isCreating && { opacity: 0.7 }]}
                                >
                                    {isCreating ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Plus size={horizontalScale(18)} color="#FFFFFF" />
                                            <Text style={styles.modalConfirmText}>{t.add}</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        backgroundColor: colors.bgPrimary,
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    doneButton: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(20),
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    doneButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Search
    searchContainer: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
    },
    searchInputWrapper: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(24),
        paddingHorizontal: horizontalScale(16),
        height: verticalScale(48),
    },
    searchIcon: {
        marginRight: horizontalScale(12),
    },
    searchInput: {
        flex: 1,
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        height: '100%',
        textAlign: 'right',
    },
    // Filter Tabs
    filterContainer: {
        paddingVertical: verticalScale(8),
    },
    filterScrollContent: {
        paddingHorizontal: horizontalScale(16),
        gap: horizontalScale(8),
        flexDirection: 'row-reverse'
    },
    filterTabActive: {
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(20),
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    filterTabActiveText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: '#FFFFFF',
    },
    filterTabInactive: {
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(20),
        backgroundColor: colors.bgPrimary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterTabInactiveText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: verticalScale(12),
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    // Empty
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(32),
        gap: verticalScale(12),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'center',
    },
    // List
    listContainer: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: horizontalScale(16),
    },
    sectionTitle: {
        fontSize: ScaleFontSize(11),
        fontWeight: '700',
        color: '#AAB8C5',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: verticalScale(16),
        marginBottom: verticalScale(8),
        textAlign: 'right',
    },
    // Food Item Row
    foodItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: verticalScale(12),
        paddingHorizontal: horizontalScale(4),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: horizontalScale(15),
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
    foodInfo: {
        flex: 1,
    },
    foodNameAr: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
        textAlign: 'right',
    },
    foodNameEn: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(2),
        textAlign: 'right',
    },
    caloriesContainer: {
        alignItems: 'flex-end',
    },
    caloriesText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    // Floating Button
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(16),
        backgroundColor: colors.bgPrimary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    floatingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: verticalScale(48),
        borderRadius: horizontalScale(24),
        gap: horizontalScale(8),
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    floatingButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: horizontalScale(24),
    },
    modalContainer: {
        width: '100%',
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(20),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(20),
    },
    modalTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    modalCloseButton: {
        padding: horizontalScale(4),
    },
    modalInputGroup: {
        marginBottom: verticalScale(16),
    },
    modalInputLabel: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: colors.textSecondary,
        marginBottom: verticalScale(6),
        textAlign: 'left',
    },
    modalInput: {
        height: verticalScale(44),
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: horizontalScale(12),
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        textAlign: 'right'
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: horizontalScale(12),
        marginTop: verticalScale(8),
    },
    modalCancelButton: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(10),
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textSecondary,
    },
    modalConfirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(6),
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(10),
        borderRadius: horizontalScale(8),
    },
    modalConfirmText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Category Chips in Modal
    categoryScrollContent: {
        gap: horizontalScale(8),
        paddingVertical: verticalScale(4),
    },
    categoryChipActive: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(16),
    },
    categoryChipActiveText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: '#FFFFFF',
    },
    categoryChipInactive: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(16),
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryChipInactiveText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: colors.textSecondary,
    },
});

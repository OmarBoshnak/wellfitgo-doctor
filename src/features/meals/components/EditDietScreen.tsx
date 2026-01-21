import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowLeft,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Info,
    Flame,
    UtensilsCrossed,
    Minus,
    Plus,
    Pencil,
    Trash2,
    X,
    LibraryBig,
    Check,
    FileText,
    BookOpen,
    ChevronRight,
    ChevronLeft,
    Calendar,
} from 'lucide-react-native';
import { colors, gradients } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDietDetails } from '../hooks/useDietDetails';
import { usePlanMutations, MealData, MealCategory as MealCategoryType, MealOption } from '../hooks/usePlanMutations';
import FoodLibraryScreen from './FoodLibraryScreen';

// ============ TRANSLATIONS ============
const t = {
    edit: isRTL ? 'تعديل' : 'Edit',
    save: isRTL ? 'حفظ' : 'Save',
    saving: isRTL ? 'جاري الحفظ...' : 'Saving...',
    basicInfo: isRTL ? 'المعلومات الأساسية' : 'Basic Info',
    calorieRange: isRTL ? 'نطاق السعرات' : 'Calorie Range',
    goalDescription: isRTL ? 'وصف الهدف' : 'Goal Description',
    mealsPerDay: isRTL ? 'عدد الوجبات يوميًا' : 'Meals per day',
    mealPlanEditor: isRTL ? 'محرر خطة الوجبات' : 'MEAL PLAN EDITOR',
    expandAll: isRTL ? 'توسيع الكل' : 'Expand All',
    optionsAvailable: isRTL ? 'خيارات متاحة' : 'options available',
    addFoodItem: isRTL ? 'إضافة عنصر غذائي' : 'Add Food Item',
    addFoodCategory: isRTL ? 'إضافة فئة غذائية' : 'Add Food Category',
    enterGoal: isRTL ? 'أدخل وصف الهدف' : 'Enter goal description',
    enterCalorieRange: isRTL ? 'مثال: 1500-1800' : 'e.g. 1500-1800',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    notFound: isRTL ? 'الخطة غير موجودة' : 'Plan not found',
    planName: isRTL ? 'اسم الخطة' : 'Plan Name',
    enterPlanName: isRTL ? 'أدخل اسم الخطة' : 'Enter plan name',
    // Modal translations
    cancel: isRTL ? 'إلغاء' : 'Cancel',
    confirm: isRTL ? 'تأكيد' : 'Confirm',
    delete: isRTL ? 'حذف' : 'Delete',
    deleteMeal: isRTL ? 'حذف الوجبة' : 'Delete Meal',
    deleteMealConfirm: isRTL ? 'هل أنت متأكد من حذف' : 'Are you sure you want to delete',
    editMealName: isRTL ? 'تعديل اسم الوجبة' : 'Edit Meal Name',
    editCategoryName: isRTL ? 'تعديل اسم الفئة' : 'Edit Category Name',
    nameAr: isRTL ? 'الاسم بالعربية' : 'Arabic Name',
    nameEn: isRTL ? 'الاسم بالإنجليزية' : 'English Name',
    foodItem: isRTL ? 'العنصر الغذائي' : 'Food Item',
    enterFoodItem: isRTL ? 'أدخل اسم العنصر' : 'Enter food item',
    newCategory: isRTL ? 'فئة جديدة' : 'New Category',
    noMeals: isRTL ? 'لا توجد وجبات' : 'No meals configured',
    // Save options translations
    saveOptions: isRTL ? 'خيارات الحفظ' : 'Save Options',
    updateExisting: isRTL ? 'تحديث الخطة الحالية' : 'Update Existing Diet',
    saveAsNew: isRTL ? 'حفظ كخطة جديدة' : 'Save as New Diet',
    newDietName: isRTL ? 'اسم الخطة الجديدة' : 'New Diet Name',
    enterNewName: isRTL ? 'أدخل اسم الخطة الجديدة' : 'Enter new diet name',
    create: isRTL ? 'إنشاء' : 'Create',
    editFoodItem: isRTL ? 'تعديل العنصر الغذائي' : 'Edit Food Item',
    // Add Food Options Modal
    addToCategory: isRTL ? 'إضافة إلى' : 'Add to',
    addNewFoodItem: isRTL ? 'إضافة عنصر غذائي جديد' : 'Add a New Food Item',
    createFromScratch: isRTL ? 'إنشاء يدوياً من الصفر' : 'Create manually from scratch',
    addFromLibrary: isRTL ? 'إضافة من المكتبة' : 'Add Food Item (from library)',
    searchExisting: isRTL ? 'البحث في قاعدة البيانات' : 'Search existing database',
    // Days
    saturday: isRTL ? 'السبت' : 'Saturday',
    sunday: isRTL ? 'الأحد' : 'Sunday',
    monday: isRTL ? 'الاثنين' : 'Monday',
    tuesday: isRTL ? 'الثلاثاء' : 'Tuesday',
    wednesday: isRTL ? 'الأربعاء' : 'Wednesday',
    thursday: isRTL ? 'الخميس' : 'Thursday',
    friday: isRTL ? 'الجمعة' : 'Friday',
};

const DAYS_ORDER = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// ============ PROPS ============
interface Props {
    dietId: string;
    onBack: () => void;
    onSave?: () => void;
}

// ============ HELPER: Generate unique ID ============
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============ EDIT MODAL COMPONENT ============
interface EditModalProps {
    visible: boolean;
    title: string;
    nameAr: string;
    nameEn: string;
    onChangeNameAr: (text: string) => void;
    onChangeNameEn: (text: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
}

const EditModal = ({ visible, title, nameAr, nameEn, onChangeNameAr, onChangeNameEn, onCancel, onConfirm }: EditModalProps) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
        >
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>{title}</Text>

                <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>{t.nameAr}</Text>
                    <TextInput
                        style={[styles.modalInput, { textAlign: 'right' }]}
                        value={nameAr}
                        onChangeText={onChangeNameAr}
                        placeholder={t.nameAr}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>{t.nameEn}</Text>
                    <TextInput
                        style={[styles.modalInput, { textAlign: 'left' }]}
                        value={nameEn}
                        onChangeText={onChangeNameEn}
                        placeholder={t.nameEn}
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.modalCancelButton} onPress={onCancel}>
                        <Text style={styles.modalCancelText}>{t.cancel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onConfirm}>
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.modalConfirmButton}
                        >
                            <Check size={horizontalScale(18)} color="#FFFFFF" />
                            <Text style={styles.modalConfirmText}>{t.confirm}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    </Modal>
);

// ============ ADD FOOD MODAL COMPONENT ============
interface AddFoodModalProps {
    visible: boolean;
    value: string;
    onChangeValue: (text: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
}

const AddFoodModal = ({ visible, value, onChangeValue, onCancel, onConfirm }: AddFoodModalProps) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
        >
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>{t.addFoodItem}</Text>

                <View style={styles.modalInputGroup}>
                    <Text style={styles.modalInputLabel}>{t.foodItem}</Text>
                    <TextInput
                        style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
                        value={value}
                        onChangeText={onChangeValue}
                        placeholder={t.enterFoodItem}
                        placeholderTextColor={colors.textSecondary}
                        autoFocus
                    />
                </View>

                <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.modalCancelButton} onPress={onCancel}>
                        <Text style={styles.modalCancelText}>{t.cancel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onConfirm}>
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.modalConfirmButton}
                        >
                            <Plus size={horizontalScale(18)} color="#FFFFFF" />
                            <Text style={styles.modalConfirmText}>{t.addFoodItem}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    </Modal>
);

// ============ FOOD ITEM COMPONENT ============
interface FoodItemProps {
    item: MealOption;
    onEdit: () => void;
    onRemove: () => void;
}

const FoodItem = ({ item, onEdit, onRemove }: FoodItemProps) => (
    <View style={[styles.foodItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
        <View style={[styles.foodItemContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <View style={styles.foodItemDot} />
            <Text style={[styles.foodItemText, { textAlign: isRTL ? 'left' : 'right' }]}>
                {item.text}{item.textEn ? ` (${item.textEn})` : ''}
            </Text>
        </View>
        <View style={[styles.foodItemActions, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <TouchableOpacity style={styles.removeItemButton} onPress={onEdit}>
                <Pencil size={horizontalScale(16)} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeItemButton} onPress={onRemove}>
                <Trash2 size={horizontalScale(16)} color="#EF4444" />
            </TouchableOpacity>
        </View>
    </View>
);

// ============ CATEGORY CARD COMPONENT ============
interface CategoryCardProps {
    category: MealCategoryType;
    onEditName: () => void;
    onDeleteCategory: () => void;
    onAddFood: () => void;
    onEditFood: (itemId: string) => void;
    onRemoveFood: (itemId: string) => void;
}

const CategoryCard = ({ category, onEditName, onDeleteCategory, onAddFood, onEditFood, onRemoveFood }: CategoryCardProps) => (
    <View style={styles.categoryCard}>
        {/* Category Header */}
        <View style={[styles.categoryHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <Text style={styles.categoryTitle}>
                {category.emoji || '📋'} {category.nameAr || category.name} ({category.name})
            </Text>
            <View style={[styles.categoryActions, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <TouchableOpacity style={styles.categoryActionButton} onPress={onEditName}>
                    <Pencil size={horizontalScale(16)} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.categoryActionButton} onPress={onDeleteCategory}>
                    <Trash2 size={horizontalScale(16)} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>

        {/* Food Items */}
        <View style={styles.foodItemsList}>
            {category.options.map(item => (
                <FoodItem
                    key={item.id}
                    item={item}
                    onEdit={() => onEditFood(item.id)}
                    onRemove={() => onRemoveFood(item.id)}
                />
            ))}
        </View>

        {/* Add Food Item Button */}
        <TouchableOpacity
            style={[styles.addItemButton, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
            onPress={onAddFood}
        >
            <Plus size={horizontalScale(18)} color={colors.primaryDark} />
            <Text style={styles.addItemText}>{t.addFoodItem}</Text>
        </TouchableOpacity>
    </View>
);

// ============ MEAL CARD COMPONENT ============
interface MealCardProps {
    meal: MealData;
    isExpanded: boolean;
    onToggle: () => void;
    onDelete: () => void;
    onEditName: () => void;
    onAddCategory: () => void;
    onEditCategoryName: (categoryId: string) => void;
    onDeleteCategory: (categoryId: string) => void;
    onAddFood: (categoryId: string) => void;
    onEditFood: (categoryId: string, itemId: string) => void;
    onRemoveFood: (categoryId: string, itemId: string) => void;
}

const MealCard = ({
    meal,
    isExpanded,
    onToggle,
    onDelete,
    onEditName,
    onAddCategory,
    onEditCategoryName,
    onDeleteCategory,
    onAddFood,
    onEditFood,
    onRemoveFood,
}: MealCardProps) => {
    // Calculate options count
    const optionsCount = meal.categories.reduce((sum, cat) => sum + cat.options.length, 0);

    return (
        <View style={styles.mealCard}>
            {/* Meal Summary Header */}
            <TouchableOpacity
                style={[styles.mealHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                    <Text style={[styles.mealTitle, { textAlign: isRTL ? 'left' : 'right' }]}>
                        {meal.emoji || '🍽️'} {meal.nameAr || meal.name} ({meal.name})
                    </Text>
                    <Text style={styles.mealSubtitle}>
                        • {optionsCount} {t.optionsAvailable}
                    </Text>
                </View>
                <View style={[styles.mealActions, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <TouchableOpacity style={styles.mealActionButton} onPress={onEditName}>
                        <Pencil size={horizontalScale(20)} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mealActionButton} onPress={onDelete}>
                        <Trash2 size={horizontalScale(20)} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {isExpanded ? (
                        <ChevronUp size={horizontalScale(20)} color={colors.textSecondary} />
                    ) : (
                        <ChevronDown size={horizontalScale(20)} color={colors.textSecondary} />
                    )}
                </View>
            </TouchableOpacity>

            {/* Expanded Content */}
            {isExpanded && (
                <View style={styles.mealContent}>
                    {/* Categories */}
                    {meal.categories.map(category => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            onEditName={() => onEditCategoryName(category.id)}
                            onDeleteCategory={() => onDeleteCategory(category.id)}
                            onAddFood={() => onAddFood(category.id)}
                            onEditFood={(itemId) => onEditFood(category.id, itemId)}
                            onRemoveFood={(itemId) => onRemoveFood(category.id, itemId)}
                        />
                    ))}

                    {/* Add Category Button */}
                    <TouchableOpacity
                        style={[styles.addCategoryButton, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                        onPress={onAddCategory}
                    >
                        <LibraryBig size={horizontalScale(20)} color={colors.textSecondary} />
                        <Text style={styles.addCategoryText}>{t.addFoodCategory}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

// ============ MAIN COMPONENT ============
export default function EditDietScreen({ dietId, onBack, onSave }: Props) {
    const { plan, isLoading } = useDietDetails(dietId);
    const { updateDietPlan, createDietPlan, isLoading: isSaving } = usePlanMutations();
    const insets = useSafeAreaInsets();

    // ===== FORM STATE =====
    const [name, setName] = useState('');
    const [targetCalories, setTargetCalories] = useState('');
    const [description, setDescription] = useState('');
    const [mealsPerDay, setMealsPerDay] = useState(3);
    const [basicInfoOpen, setBasicInfoOpen] = useState(true);
    const [expandedMeals, setExpandedMeals] = useState<string[]>([]);

    // ===== LOCAL MEALS STATE (editable) =====
    const [localMeals, setLocalMeals] = useState<MealData[]>([]);

    // ===== DAILY MODE STATE =====
    const [selectedDay, setSelectedDay] = useState<string>('saturday');
    const [dailyMealsMap, setDailyMealsMap] = useState<Record<string, MealData[]>>({});
    const [isDailyPlan, setIsDailyPlan] = useState(false);

    // ===== MODAL STATES =====
    const [editMealModal, setEditMealModal] = useState<{
        visible: boolean;
        mealId: string;
        nameAr: string;
        nameEn: string;
    } | null>(null);

    const [editCategoryModal, setEditCategoryModal] = useState<{
        visible: boolean;
        mealId: string;
        categoryId: string;
        nameAr: string;
        nameEn: string;
    } | null>(null);

    const [addFoodModal, setAddFoodModal] = useState<{
        visible: boolean;
        mealId: string;
        categoryId: string;
        value: string;
    } | null>(null);

    const [editFoodModal, setEditFoodModal] = useState<{
        visible: boolean;
        mealId: string;
        categoryId: string;
        itemId: string;
        value: string;
    } | null>(null);

    // ===== SAVE OPTIONS MODAL STATES =====
    const [saveOptionsVisible, setSaveOptionsVisible] = useState(false);
    const [saveAsNewModal, setSaveAsNewModal] = useState<{
        visible: boolean;
        newName: string;
    } | null>(null);

    // ===== FOOD LIBRARY STATE =====
    const [showFoodLibrary, setShowFoodLibrary] = useState(false);
    const [foodLibraryContext, setFoodLibraryContext] = useState<{
        mealId: string;
        categoryId: string;
    } | null>(null);

    // ===== INITIALIZE FROM PLAN DATA =====
    useEffect(() => {
        if (plan) {
            console.log('=== LOADING PLAN ===');
            console.log('Plan ID:', plan._id);
            console.log('Plan format:', plan.format);
            console.log('Plan has meals:', !!plan.meals);
            console.log('Plan has dailyMeals:', !!plan.dailyMeals);

            setName(plan.name || '');
            setTargetCalories(plan.targetCalories?.toString() || '');
            setDescription(plan.description || '');

            // Initialize localMeals from plan data
            let rawMeals: MealData[] = [];
            const newDailyMap: Record<string, MealData[]> = {};

            if (plan.format === 'general' && plan.meals) {
                setIsDailyPlan(false);
                console.log('Loading from GENERAL format, meals count:', plan.meals.length);
                rawMeals = plan.meals.map(meal => ({
                    id: (meal.id || meal._id || generateId()) as string,
                    emoji: meal.emoji,
                    name: meal.name,
                    nameAr: meal.nameAr,
                    time: meal.time,
                    note: meal.note,
                    noteAr: meal.noteAr,
                    categories: meal.categories.map(cat => ({
                        id: (cat.id || cat._id || generateId()) as string,
                        emoji: cat.emoji,
                        name: cat.name,
                        nameAr: cat.nameAr,
                        options: cat.options.map(opt => ({
                            id: (opt.id || opt._id || generateId()) as string,
                            text: opt.text,
                            textEn: opt.textEn,
                        })),
                    })),
                }));
                // For general plans, we still init daily map just in case user switches (future feature) but primarily use localMeals
            } else if (plan.format === 'daily' && plan.dailyMeals) {
                setIsDailyPlan(true);
                // Use first day's meals for editing initially
                const firstDay = Object.keys(plan.dailyMeals)[0] || 'saturday';
                console.log('Loading from DAILY format, first day:', firstDay);

                // Populate all days
                DAYS_ORDER.forEach(day => {
                    const dayData = plan.dailyMeals?.[day];
                    if (dayData?.meals) {
                        newDailyMap[day] = dayData.meals.map((meal: MealData) => ({
                            id: (meal.id || meal._id || generateId()) as string,
                            emoji: meal.emoji,
                            name: meal.name,
                            nameAr: meal.nameAr,
                            time: meal.time,
                            note: meal.note,
                            noteAr: meal.noteAr,
                            categories: meal.categories.map(cat => ({
                                id: (cat.id || cat._id || generateId()) as string,
                                emoji: cat.emoji,
                                name: cat.name,
                                nameAr: cat.nameAr,
                                options: cat.options.map(opt => ({
                                    id: (opt.id || opt._id || generateId()) as string,
                                    text: opt.text,
                                    textEn: opt.textEn,
                                })),
                            })),
                        }));
                    } else {
                        newDailyMap[day] = [];
                    }
                });

                setDailyMealsMap(newDailyMap);
                setSelectedDay(firstDay);
                rawMeals = newDailyMap[firstDay] || [];
            }

            console.log('Loaded rawMeals count:', rawMeals.length);
            setLocalMeals(rawMeals);
            setMealsPerDay(rawMeals.length || 3);
            setExpandedMeals(rawMeals.length > 0 ? [rawMeals[0].id] : []);
        }
    }, [plan]);

    // Switch Day Handler
    const handleDayPress = (newDay: string) => {
        if (newDay === selectedDay) return;

        // Update map with current state immediately for the switch
        const updatedMap = { ...dailyMealsMap, [selectedDay]: localMeals };
        setDailyMealsMap(updatedMap);

        // Load next day
        const nextDayMeals = updatedMap[newDay] || [];
        setLocalMeals(nextDayMeals);
        setSelectedDay(newDay);
        setExpandedMeals(nextDayMeals.length > 0 ? [nextDayMeals[0].id] : []);
    };

    // ===== MEAL CRUD HANDLERS =====

    // Delete a meal
    const handleDeleteMeal = useCallback((mealId: string) => {
        const meal = localMeals.find(m => m.id === mealId);
        const mealName = meal?.nameAr || meal?.name || 'Meal';

        Alert.alert(
            t.deleteMeal,
            `${t.deleteMealConfirm} "${mealName}"?`,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.delete,
                    style: 'destructive',
                    onPress: () => {
                        setLocalMeals(prev => prev.filter(m => m.id !== mealId));
                        setExpandedMeals(prev => prev.filter(id => id !== mealId));
                    },
                },
            ]
        );
    }, [localMeals]);

    // Open edit meal name modal
    const handleOpenEditMealModal = useCallback((mealId: string) => {
        const meal = localMeals.find(m => m.id === mealId);
        if (meal) {
            setEditMealModal({
                visible: true,
                mealId,
                nameAr: meal.nameAr || '',
                nameEn: meal.name,
            });
        }
    }, [localMeals]);

    // Confirm edit meal name
    const handleConfirmEditMeal = useCallback(() => {
        if (!editMealModal) return;

        setLocalMeals(prev =>
            prev.map(meal =>
                meal.id === editMealModal.mealId
                    ? { ...meal, name: editMealModal.nameEn, nameAr: editMealModal.nameAr }
                    : meal
            )
        );
        setEditMealModal(null);
    }, [editMealModal]);

    // Add a new category to a meal
    const handleAddCategory = useCallback((mealId: string) => {
        const newCategory: MealCategoryType = {
            id: generateId(),
            emoji: '📋',
            name: 'New Category',
            nameAr: 'فئة جديدة',
            options: [],
        };

        setLocalMeals(prev =>
            prev.map(meal =>
                meal.id === mealId
                    ? { ...meal, categories: [...meal.categories, newCategory] }
                    : meal
            )
        );
    }, []);

    // ===== CATEGORY CRUD HANDLERS =====

    // Open edit category name modal
    const handleOpenEditCategoryModal = useCallback((mealId: string, categoryId: string) => {
        const meal = localMeals.find(m => m.id === mealId);
        const category = meal?.categories.find(c => c.id === categoryId);
        if (category) {
            setEditCategoryModal({
                visible: true,
                mealId,
                categoryId,
                nameAr: category.nameAr || '',
                nameEn: category.name,
            });
        }
    }, [localMeals]);

    // Confirm edit category name
    const handleConfirmEditCategory = useCallback(() => {
        if (!editCategoryModal) return;

        setLocalMeals(prev =>
            prev.map(meal =>
                meal.id === editCategoryModal.mealId
                    ? {
                        ...meal,
                        categories: meal.categories.map(cat =>
                            cat.id === editCategoryModal.categoryId
                                ? { ...cat, name: editCategoryModal.nameEn, nameAr: editCategoryModal.nameAr }
                                : cat
                        ),
                    }
                    : meal
            )
        );
        setEditCategoryModal(null);
    }, [editCategoryModal]);

    // Delete a category from a meal
    const handleDeleteCategory = useCallback((mealId: string, categoryId: string) => {
        const meal = localMeals.find(m => m.id === mealId);
        const category = meal?.categories.find(c => c.id === categoryId);
        const categoryName = category?.nameAr || category?.name || 'Category';

        Alert.alert(
            isRTL ? 'حذف الفئة' : 'Delete Category',
            `${isRTL ? 'هل أنت متأكد من حذف' : 'Are you sure you want to delete'} "${categoryName}"?`,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.delete,
                    style: 'destructive',
                    onPress: () => {
                        setLocalMeals(prev =>
                            prev.map(meal =>
                                meal.id === mealId
                                    ? { ...meal, categories: meal.categories.filter(c => c.id !== categoryId) }
                                    : meal
                            )
                        );
                    },
                },
            ]
        );
    }, [localMeals]);

    // ===== FOOD ITEM CRUD HANDLERS =====

    // Open food library directly (go straight to library screen)
    const handleOpenAddFoodModal = useCallback((mealId: string, categoryId: string) => {
        // Store the context and show library screen directly
        setFoodLibraryContext({
            mealId,
            categoryId,
        });
        setShowFoodLibrary(true);
    }, []);

    // Handle foods selected from library
    const handleLibraryFoodsSelected = useCallback((foods: { id: string; nameAr: string; nameEn: string; calories: number }[]) => {
        if (!foodLibraryContext) {
            setShowFoodLibrary(false);
            return;
        }

        // Add selected foods to the category
        const newItems: MealOption[] = foods.map(food => ({
            id: generateId(),
            text: food.nameAr,
            textEn: food.nameEn,
        }));

        setLocalMeals(prev =>
            prev.map(meal =>
                meal.id === foodLibraryContext.mealId
                    ? {
                        ...meal,
                        categories: meal.categories.map(cat =>
                            cat.id === foodLibraryContext.categoryId
                                ? { ...cat, options: [...cat.options, ...newItems] }
                                : cat
                        ),
                    }
                    : meal
            )
        );

        setShowFoodLibrary(false);
        setFoodLibraryContext(null);
    }, [foodLibraryContext]);

    // Confirm add food item
    const handleConfirmAddFood = useCallback(() => {
        if (!addFoodModal || !addFoodModal.value.trim()) return;

        const newItem: MealOption = {
            id: generateId(),
            text: addFoodModal.value.trim(),
        };

        setLocalMeals(prev =>
            prev.map(meal =>
                meal.id === addFoodModal.mealId
                    ? {
                        ...meal,
                        categories: meal.categories.map(cat =>
                            cat.id === addFoodModal.categoryId
                                ? { ...cat, options: [...cat.options, newItem] }
                                : cat
                        ),
                    }
                    : meal
            )
        );
        setAddFoodModal(null);
    }, [addFoodModal]);

    // Remove food item
    const handleRemoveFoodItem = useCallback((mealId: string, categoryId: string, itemId: string) => {
        setLocalMeals(prev =>
            prev.map(meal =>
                meal.id === mealId
                    ? {
                        ...meal,
                        categories: meal.categories.map(cat =>
                            cat.id === categoryId
                                ? { ...cat, options: cat.options.filter(opt => opt.id !== itemId) }
                                : cat
                        ),
                    }
                    : meal
            )
        );
    }, []);

    // Open edit food modal
    const handleOpenEditFoodModal = useCallback((mealId: string, categoryId: string, itemId: string) => {
        const meal = localMeals.find(m => m.id === mealId);
        const category = meal?.categories.find(c => c.id === categoryId);
        const item = category?.options.find(o => o.id === itemId);
        if (item) {
            setEditFoodModal({
                visible: true,
                mealId,
                categoryId,
                itemId,
                value: item.text,
            });
        }
    }, [localMeals]);

    // Confirm edit food item
    const handleConfirmEditFood = useCallback(() => {
        if (!editFoodModal || !editFoodModal.value.trim()) return;

        setLocalMeals(prev =>
            prev.map(meal =>
                meal.id === editFoodModal.mealId
                    ? {
                        ...meal,
                        categories: meal.categories.map(cat =>
                            cat.id === editFoodModal.categoryId
                                ? {
                                    ...cat,
                                    options: cat.options.map(opt =>
                                        opt.id === editFoodModal.itemId
                                            ? { ...opt, text: editFoodModal.value.trim() }
                                            : opt
                                    ),
                                }
                                : cat
                        ),
                    }
                    : meal
            )
        );
        setEditFoodModal(null);
    }, [editFoodModal]);

    // ===== UI HANDLERS =====

    const BackArrow = () => isRTL
        ? <ArrowLeft size={horizontalScale(24)} color={colors.textPrimary} />
        : <ArrowRight size={horizontalScale(24)} color={colors.textPrimary} />;

    const toggleMealExpansion = (mealId: string) => {
        setExpandedMeals(prev =>
            prev.includes(mealId)
                ? prev.filter(id => id !== mealId)
                : [...prev, mealId]
        );
    };

    const handleExpandAll = () => {
        if (expandedMeals.length === localMeals.length) {
            setExpandedMeals([]);
        } else {
            setExpandedMeals(localMeals.map(m => m.id));
        }
    };

    // ===== SAVE HANDLERS =====

    // Show save options modal when save button is pressed
    const handleSavePress = () => {
        setSaveOptionsVisible(true);
    };

    // Save to existing diet
    const handleUpdateExisting = async () => {
        setSaveOptionsVisible(false);
        try {
            console.log('=== UPDATING EXISTING DIET PLAN ===');

            // Prepare final map including current screen state
            let dailyMealsPayload: Record<string, { meals: MealData[] }> | undefined;
            if (isDailyPlan) {
                const finalDailyMeals = {
                    ...dailyMealsMap,
                    [selectedDay]: localMeals
                };
                dailyMealsPayload = Object.entries(finalDailyMeals).reduce((acc: any, [day, meals]) => {
                    acc[day] = { meals };
                    return acc;
                }, {});
            }

            await updateDietPlan({
                id: dietId,
                name: name.trim(),
                description: description.trim() || undefined,
                targetCalories: targetCalories ? parseInt(targetCalories, 10) : undefined,
                meals: isDailyPlan ? [] : localMeals,
                dailyMeals: dailyMealsPayload,
            });

            console.log('=== UPDATE SUCCESSFUL ===');
            Alert.alert(
                isRTL ? 'تم الحفظ' : 'Saved',
                isRTL ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully',
                [{ text: isRTL ? 'حسناً' : 'OK', onPress: () => { onSave?.(); onBack(); } }]
            );
        } catch (error) {
            console.error('=== UPDATE FAILED ===', error);
            Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                isRTL ? 'فشل في حفظ التغييرات. حاول مرة أخرى.' : 'Failed to save changes. Please try again.',
                [{ text: isRTL ? 'حسناً' : 'OK' }]
            );
        }
    };

    // Open save as new modal
    const handleOpenSaveAsNew = () => {
        setSaveOptionsVisible(false);
        setSaveAsNewModal({
            visible: true,
            newName: `${name} (Copy)`,
        });
    };

    // Create new diet with current meals
    const handleSaveAsNew = async () => {
        if (!saveAsNewModal || !saveAsNewModal.newName.trim()) return;

        setSaveAsNewModal(null);
        try {
            console.log('=== CREATING NEW DIET PLAN ===');

            // Prepare final map including current screen state
            let dailyMealsPayload: Record<string, { meals: MealData[] }> | undefined;
            if (isDailyPlan) {
                const finalDailyMeals = {
                    ...dailyMealsMap,
                    [selectedDay]: localMeals
                };
                dailyMealsPayload = Object.entries(finalDailyMeals).reduce((acc: any, [day, meals]) => {
                    acc[day] = { meals };
                    return acc;
                }, {});
            }

            await createDietPlan({
                name: saveAsNewModal.newName.trim(),
                description: description.trim() || undefined,
                type: (plan?.type === 'all' ? 'custom' : plan?.type) as any || 'custom',
                targetCalories: targetCalories ? parseInt(targetCalories, 10) : undefined,
                meals: isDailyPlan ? [] : localMeals,
                dailyMeals: dailyMealsPayload,
            });

            console.log('=== CREATE SUCCESSFUL ===');
            Alert.alert(
                isRTL ? 'تم الإنشاء' : 'Created',
                isRTL ? 'تم إنشاء الخطة الجديدة بنجاح' : 'New diet created successfully',
                [{ text: isRTL ? 'حسناً' : 'OK', onPress: () => { onSave?.(); onBack(); } }]
            );
        } catch (error) {
            console.error('=== CREATE FAILED ===', error);
            Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                isRTL ? 'فشل في إنشاء الخطة الجديدة. حاول مرة أخرى.' : 'Failed to create new diet. Please try again.',
                [{ text: isRTL ? 'حسناً' : 'OK' }]
            );
        }
    };

    // ============ SHOW FOOD LIBRARY SCREEN ============
    if (showFoodLibrary) {
        return (
            <FoodLibraryScreen
                onBack={() => {
                    setShowFoodLibrary(false);
                    setFoodLibraryContext(null);
                }}
                onSelectFoods={handleLibraryFoodsSelected}
            />
        );
    }

    // ============ LOADING STATE ============
    if (isLoading) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.container}>
                <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse', paddingTop: insets.top }]}>
                    <View style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>{t.save}</Text>
                    </View>
                    <Text style={styles.headerTitle}>{t.loading}</Text>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <BackArrow />
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ============ NOT FOUND STATE ============
    if (!plan) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.container}>
                <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse', paddingTop: insets.top }]}>
                    <View style={{ width: horizontalScale(60) }} />
                    <Text style={styles.headerTitle}>{t.notFound}</Text>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <BackArrow />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ============ MAIN RENDER ============
    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse', paddingTop: insets.top }]}>
                <TouchableOpacity onPress={handleSavePress} activeOpacity={0.9} disabled={isSaving}>
                    <LinearGradient
                        colors={isSaving ? ['#E1E8EF', '#E1E8EF'] : gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButton}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color={colors.textSecondary} />
                        ) : (
                            <Text style={styles.saveButtonText}>{t.save}</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {t.edit} {plan.name}
                </Text>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <BackArrow />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: horizontalScale(10) }} showsVerticalScrollIndicator={false}>
                {/* Basic Info Section */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => setBasicInfoOpen(!basicInfoOpen)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.sectionHeaderLeft, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <View style={styles.sectionIcon}>
                                <Info size={horizontalScale(20)} color={colors.primaryDark} />
                            </View>
                            <Text style={styles.sectionTitle}>{t.basicInfo}</Text>
                        </View>
                        {basicInfoOpen ? (
                            <ChevronUp size={horizontalScale(20)} color={colors.textSecondary} />
                        ) : (
                            <ChevronDown size={horizontalScale(20)} color={colors.textSecondary} />
                        )}
                    </TouchableOpacity>

                    {basicInfoOpen && (
                        <View style={styles.sectionContent}>
                            {/* Plan Name Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                    {t.planName}
                                </Text>
                                <TextInput
                                    style={[styles.inputSimple, { textAlign: isRTL ? 'left' : 'right' }]}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder={t.enterPlanName}
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            {/* Calorie Range Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                    {t.calorieRange}
                                </Text>
                                <View style={styles.inputContainer}>
                                    <Flame size={horizontalScale(20)} color={colors.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                                        value={targetCalories}
                                        onChangeText={setTargetCalories}
                                        placeholder={t.enterCalorieRange}
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            {/* Goal Description Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
                                    {t.goalDescription}
                                </Text>
                                <TextInput
                                    style={[styles.inputSimple, { textAlign: isRTL ? 'right' : 'left' }]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder={t.enterGoal}
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            {/* Meals Per Day Stepper */}
                            <View style={[styles.stepperRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={[styles.stepperLabel, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                    <UtensilsCrossed size={horizontalScale(20)} color={colors.textSecondary} />
                                    <Text style={styles.stepperText}>{t.mealsPerDay}</Text>
                                </View>
                                <View style={styles.stepperControls}>
                                    <TouchableOpacity
                                        style={styles.stepperButton}
                                        onPress={() => {
                                            if (localMeals.length > 1) {
                                                // Remove the last meal
                                                setLocalMeals(prev => prev.slice(0, -1));
                                            }
                                        }}
                                    >
                                        <Minus size={horizontalScale(18)} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <Text style={styles.stepperValue}>{localMeals.length}</Text>
                                    <TouchableOpacity
                                        style={styles.stepperButtonActive}
                                        onPress={() => {
                                            // Add a new meal with a default category
                                            const mealNumber = localMeals.length + 1;
                                            const newMeal: MealData = {
                                                id: generateId(),
                                                emoji: '🍽️',
                                                name: `Meal ${mealNumber}`,
                                                nameAr: `وجبة ${mealNumber}`,
                                                categories: [{
                                                    id: generateId(),
                                                    emoji: '📋',
                                                    name: 'New Category',
                                                    nameAr: 'فئة جديدة',
                                                    options: [],
                                                }],
                                            };
                                            setLocalMeals(prev => [...prev, newMeal]);
                                            // Expand the new meal
                                            setExpandedMeals(prev => [...prev, newMeal.id]);
                                        }}
                                    >
                                        <Plus size={horizontalScale(18)} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Days Selector */}
                {isDailyPlan && (
                    <View style={styles.daySelectorContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: horizontalScale(8) }}>
                            {DAYS_ORDER.map(day => (
                                <TouchableOpacity
                                    key={day}
                                    style={[
                                        styles.dayChip,
                                        selectedDay === day && styles.dayChipActive
                                    ]}
                                    onPress={() => handleDayPress(day)}
                                >
                                    <Text style={[
                                        styles.dayText,
                                        selectedDay === day && styles.dayTextActive
                                    ]}>
                                        {t[day as keyof typeof t] || day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Meal Plan Editor */}
                <View style={styles.mealEditorSection}>
                    <View style={[styles.mealEditorHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.mealEditorTitle}>{t.mealPlanEditor}</Text>
                        <TouchableOpacity onPress={handleExpandAll}>
                            <Text style={styles.expandAllText}>{t.expandAll}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Meals */}
                    <View style={styles.mealsList}>
                        {localMeals.length > 0 ? (
                            localMeals.map(meal => (
                                <MealCard
                                    key={meal.id}
                                    meal={meal}
                                    isExpanded={expandedMeals.includes(meal.id)}
                                    onToggle={() => toggleMealExpansion(meal.id)}
                                    onDelete={() => handleDeleteMeal(meal.id)}
                                    onEditName={() => handleOpenEditMealModal(meal.id)}
                                    onAddCategory={() => handleAddCategory(meal.id)}
                                    onEditCategoryName={(categoryId) => handleOpenEditCategoryModal(meal.id, categoryId)}
                                    onDeleteCategory={(categoryId) => handleDeleteCategory(meal.id, categoryId)}
                                    onAddFood={(categoryId) => handleOpenAddFoodModal(meal.id, categoryId)}
                                    onEditFood={(categoryId, itemId) => handleOpenEditFoodModal(meal.id, categoryId, itemId)}
                                    onRemoveFood={(categoryId, itemId) => handleRemoveFoodItem(meal.id, categoryId, itemId)}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyMeals}>
                                <Text style={styles.emptyMealsText}>{t.noMeals}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Bottom padding */}
                <View style={{ height: verticalScale(24) }} />
            </ScrollView>

            {/* Edit Meal Modal */}
            {editMealModal && (
                <EditModal
                    visible={editMealModal.visible}
                    title={t.editMealName}
                    nameAr={editMealModal.nameAr}
                    nameEn={editMealModal.nameEn}
                    onChangeNameAr={(text) => setEditMealModal(prev => prev ? { ...prev, nameAr: text } : null)}
                    onChangeNameEn={(text) => setEditMealModal(prev => prev ? { ...prev, nameEn: text } : null)}
                    onCancel={() => setEditMealModal(null)}
                    onConfirm={handleConfirmEditMeal}
                />
            )}

            {/* Edit Category Modal */}
            {editCategoryModal && (
                <EditModal
                    visible={editCategoryModal.visible}
                    title={t.editCategoryName}
                    nameAr={editCategoryModal.nameAr}
                    nameEn={editCategoryModal.nameEn}
                    onChangeNameAr={(text) => setEditCategoryModal(prev => prev ? { ...prev, nameAr: text } : null)}
                    onChangeNameEn={(text) => setEditCategoryModal(prev => prev ? { ...prev, nameEn: text } : null)}
                    onCancel={() => setEditCategoryModal(null)}
                    onConfirm={handleConfirmEditCategory}
                />
            )}

            {/* Add Food Modal */}
            {addFoodModal && (
                <AddFoodModal
                    visible={addFoodModal.visible}
                    value={addFoodModal.value}
                    onChangeValue={(text) => setAddFoodModal(prev => prev ? { ...prev, value: text } : null)}
                    onCancel={() => setAddFoodModal(null)}
                    onConfirm={handleConfirmAddFood}
                />
            )}

            {/* Edit Food Modal */}
            {editFoodModal && (
                <Modal visible={editFoodModal.visible} transparent animationType="fade" onRequestClose={() => setEditFoodModal(null)}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalOverlay}
                    >
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>{t.editFoodItem}</Text>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalInputLabel}>{t.foodItem}</Text>
                                <TextInput
                                    style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
                                    value={editFoodModal.value}
                                    onChangeText={(text) => setEditFoodModal(prev => prev ? { ...prev, value: text } : null)}
                                    placeholder={t.enterFoodItem}
                                    placeholderTextColor={colors.textSecondary}
                                    autoFocus
                                />
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setEditFoodModal(null)}>
                                    <Text style={styles.modalCancelText}>{t.cancel}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleConfirmEditFood}>
                                    <LinearGradient
                                        colors={gradients.primary}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.modalConfirmButton}
                                    >
                                        <Check size={horizontalScale(18)} color="#FFFFFF" />
                                        <Text style={styles.modalConfirmText}>{t.save}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            )}

            {/* Save Options Modal */}
            <Modal visible={saveOptionsVisible} transparent animationType="fade" onRequestClose={() => setSaveOptionsVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>{t.saveOptions}</Text>

                        <TouchableOpacity style={styles.saveOptionButton} onPress={handleUpdateExisting}>
                            <LinearGradient
                                colors={gradients.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.saveOptionGradient}
                            >
                                <Check size={horizontalScale(20)} color="#FFFFFF" />
                                <Text style={styles.saveOptionText}>{t.updateExisting}</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.saveOptionButton} onPress={handleOpenSaveAsNew}>
                            <View style={styles.saveOptionSecondary}>
                                <Plus size={horizontalScale(20)} color={colors.primaryDark} />
                                <Text style={styles.saveOptionSecondaryText}>{t.saveAsNew}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalCancelButton} onPress={() => setSaveOptionsVisible(false)}>
                            <Text style={styles.modalCancelText}>{t.cancel}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Save As New Modal */}
            {saveAsNewModal && (
                <Modal visible={saveAsNewModal.visible} transparent animationType="fade" onRequestClose={() => setSaveAsNewModal(null)}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalOverlay}
                    >
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>{t.newDietName}</Text>

                            <View style={styles.modalInputGroup}>
                                <TextInput
                                    style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
                                    value={saveAsNewModal.newName}
                                    onChangeText={(text) => setSaveAsNewModal(prev => prev ? { ...prev, newName: text } : null)}
                                    placeholder={t.enterNewName}
                                    placeholderTextColor={colors.textSecondary}
                                    autoFocus
                                />
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setSaveAsNewModal(null)}>
                                    <Text style={styles.modalCancelText}>{t.cancel}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSaveAsNew}>
                                    <LinearGradient
                                        colors={gradients.primary}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.modalConfirmButton}
                                    >
                                        <Plus size={horizontalScale(18)} color="#FFFFFF" />
                                        <Text style={styles.modalConfirmText}>{t.create}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    // Header
    header: {
        backgroundColor: colors.bgPrimary,
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
        marginHorizontal: horizontalScale(8),
    },
    saveButton: {
        paddingHorizontal: horizontalScale(20),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(20),
        minWidth: horizontalScale(60),
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Loading
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: verticalScale(12),
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    // Content
    content: {
        flex: 1,
    },
    // Section
    section: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: verticalScale(20),
        marginTop: verticalScale(16),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: horizontalScale(16),
    },
    sectionHeaderLeft: {
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    sectionIcon: {
        width: horizontalScale(32),
        height: horizontalScale(32),
        borderRadius: horizontalScale(16),
        backgroundColor: 'rgba(80, 115, 254, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    sectionContent: {
        paddingHorizontal: horizontalScale(16),
        paddingBottom: horizontalScale(20),
        paddingTop: horizontalScale(4),
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: verticalScale(16),
    },
    // Input
    inputGroup: {
        gap: verticalScale(8),
    },
    inputLabel: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: horizontalScale(12),
    },
    inputIcon: {
        marginRight: horizontalScale(8),
    },
    input: {
        flex: 1,
        height: verticalScale(48),
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    inputSimple: {
        height: verticalScale(48),
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: horizontalScale(16),
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    // Stepper
    stepperRow: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        padding: horizontalScale(12),
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepperLabel: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    stepperText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    stepperControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(6),
        padding: horizontalScale(4),
        borderWidth: 1,
        borderColor: colors.border,
        gap: horizontalScale(8),
    },
    stepperButton: {
        width: horizontalScale(28),
        height: horizontalScale(28),
        borderRadius: horizontalScale(4),
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperButtonActive: {
        width: horizontalScale(28),
        height: horizontalScale(28),
        borderRadius: horizontalScale(4),
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperValue: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: colors.textPrimary,
        minWidth: horizontalScale(16),
        textAlign: 'center',
    },
    // Meal Editor Section
    mealEditorSection: {
        gap: verticalScale(16),
    },
    mealEditorHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(4),
    },
    mealEditorTitle: {
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    expandAllText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.primaryDark,
    },
    mealsList: {
        gap: verticalScale(12),
    },
    // Meal Card
    mealCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    mealHeader: {
        padding: horizontalScale(16),
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    mealTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
        width: horizontalScale(200),
        overflow: 'hidden',
    },
    mealSubtitle: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(2),
    },
    mealActions: {
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    mealActionButton: {
        padding: horizontalScale(8),
    },
    mealContent: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(20),
        gap: verticalScale(16),
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    // Category Card
    categoryCard: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(12),
        gap: verticalScale(12),
    },
    categoryHeader: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    categoryTitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'left',
    },
    categoryActions: {
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    categoryActionButton: {
        padding: horizontalScale(6),
    },
    foodItemsList: {
        gap: verticalScale(8),
    },
    foodItem: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(6),
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(10),
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    foodItemContent: {
        flex: 1,
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    foodItemDot: {
        width: horizontalScale(6),
        height: horizontalScale(6),
        borderRadius: horizontalScale(3),
        backgroundColor: 'rgba(80, 115, 254, 0.4)',
    },
    foodItemText: {
        flex: 1,
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    foodItemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    removeItemButton: {
        padding: horizontalScale(4),
    },
    addItemButton: {
        alignItems: 'center',
        gap: horizontalScale(8),
        paddingVertical: verticalScale(8),
    },
    addItemText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.primaryDark,
    },
    // Add Category Button
    addCategoryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        padding: horizontalScale(12),
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.textSecondary,
        borderRadius: horizontalScale(8),
    },
    addCategoryText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    // Empty Meals
    emptyMeals: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
        padding: horizontalScale(24),
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyMealsText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(20),
    },
    modalContainer: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(20),
        width: '100%',
        maxWidth: horizontalScale(340),
        gap: verticalScale(16),
    },
    modalTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    modalInputGroup: {
        gap: verticalScale(6),
    },
    modalInputLabel: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: colors.textSecondary,
        textAlign: 'left'
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
    // Save Options Modal Styles
    saveOptionButton: {
        width: '100%',
    },
    saveOptionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(10),
        paddingVertical: verticalScale(14),
        borderRadius: horizontalScale(10),
    },
    saveOptionText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    saveOptionSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(10),
        paddingVertical: verticalScale(14),
        borderRadius: horizontalScale(10),
        borderWidth: 1,
        borderColor: colors.primaryDark,
        backgroundColor: 'rgba(80, 115, 254, 0.1)',
    },
    saveOptionSecondaryText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.primaryDark,
    },
    // Bottom Sheet Styles
    bottomSheetOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    bottomSheetBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    bottomSheetContainer: {
        backgroundColor: colors.bgPrimary,
        borderTopLeftRadius: horizontalScale(24),
        borderTopRightRadius: horizontalScale(24),
        paddingHorizontal: horizontalScale(24),
        paddingBottom: verticalScale(32),
        paddingTop: verticalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },
    bottomSheetHandle: {
        width: horizontalScale(48),
        height: verticalScale(6),
        borderRadius: horizontalScale(3),
        backgroundColor: colors.border,
        alignSelf: 'center',
        marginBottom: verticalScale(16),
    },
    bottomSheetTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: verticalScale(20),
    },
    bottomSheetOptions: {
        gap: verticalScale(12),
    },
    bottomSheetOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: horizontalScale(16),
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(16),
        borderWidth: 1,
        borderColor: colors.border,
        gap: horizontalScale(16),
    },
    bottomSheetOptionIcon: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(24),
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomSheetOptionContent: {
        flex: 1,
    },
    bottomSheetOptionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: verticalScale(5),
        textAlign: 'left',
    },
    bottomSheetOptionSubtitle: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        textAlign: 'left',
    },
    bottomSheetCancel: {
        marginTop: verticalScale(16),
        paddingVertical: verticalScale(16),
        borderRadius: horizontalScale(12),
        alignItems: 'center',
    },
    bottomSheetCancelText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: colors.textSecondary,
    },
    // Day Selector
    daySelectorContainer: {
        marginBottom: verticalScale(12),
    },
    dayChip: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(20),
        backgroundColor: colors.bgPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: horizontalScale(4),
    },
    dayChipActive: {
        backgroundColor: colors.bgPrimary,
        borderColor: colors.bgPrimary,
    },
    dayText: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        fontWeight: '500',
    },
    dayTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});

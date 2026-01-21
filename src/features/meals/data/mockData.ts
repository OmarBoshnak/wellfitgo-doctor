import { DoctorPlanItem, DraftPlanItem, AssignmentClient, DietProgramItem } from '../hooks/useDoctorPlans';
import { DietCategory } from '../hooks/useDietCategories';
import { DietPlan, DietType } from '../hooks/useDietsByType';
import { MealData } from '../hooks/usePlanMutations';

// --- MOCK CATEGORIES ---
export const MOCK_DIET_CATEGORIES: DietCategory[] = [
    { _id: 'keto', id: 'keto', name: 'Keto', nameAr: 'كيتو', emoji: '🥑', type: 'system', dietCount: 3 },
    { _id: 'fasting', id: 'fasting', name: 'Intermittent Fasting', nameAr: 'الصيام المتقطع', emoji: '⏰', type: 'system', dietCount: 2 },
    { _id: 'mediterranean', id: 'mediterranean', name: 'Mediterranean', nameAr: 'البحر الأبيض المتوسط', emoji: '🫒', type: 'system', dietCount: 1 },
    { _id: 'vegan', id: 'vegan', name: 'Vegan', nameAr: 'نباتي', emoji: '🥬', type: 'system', dietCount: 2 },
    { _id: 'low_carb', id: 'low_carb', name: 'Low Carb', nameAr: 'منخفض الكربوهيدرات', emoji: '🥩', type: 'system', dietCount: 4 },
    { _id: 'custom_1', id: 'custom_1', name: 'Custom List', nameAr: 'قائمة مخصصة', emoji: '📋', type: 'custom', dietCount: 1, isActive: true },
];

// --- MOCK MEAL DATA ---
const createMockMeal = (id: string, name: string, nameAr: string, time: string): MealData => ({
    id,
    _id: id,
    name,
    nameAr,
    time,
    categories: [
        {
            id: 'c1',
            name: 'Protein',
            nameAr: 'بروتين',
            options: [{ id: 'o1', text: 'Chicken Breast', selected: true }]
        }
    ]
});

// --- MOCK DIET PLANS ---
export const MOCK_DIET_PLANS: DietPlan[] = [
    {
        id: 'dp1',
        _id: 'dp1',
        name: 'Standard Keto',
        nameAr: 'كيتو قياسي',
        description: 'Standard ketogenic diet plan for beginners.',
        type: 'keto',
        emoji: '🥑',
        targetCalories: 1500,
        tags: ['weight_loss', 'low_carb'],
        meals: [
            createMockMeal('m1', 'Breakfast', 'فطور', '08:00'),
            createMockMeal('m2', 'Lunch', 'غداء', '13:00'),
            createMockMeal('m3', 'Dinner', 'عشاء', '19:00'),
        ],
        isActive: true,
        usageCount: 120,
        mealsCount: 3,
        createdAt: Date.now() - 10000000,
    },
    {
        id: 'dp2',
        _id: 'dp2',
        name: 'Vegan Power',
        nameAr: 'قوة نباتية',
        description: 'High protein vegan diet.',
        type: 'vegan',
        emoji: '🥬',
        targetCalories: 1800,
        tags: ['vegan', 'muscle_gain'],
        meals: [
            createMockMeal('m4', 'Breakfast', 'فطور', '08:00'),
            createMockMeal('m5', 'Lunch', 'غداء', '13:00'),
            createMockMeal('m6', 'Snack', 'وجبة خفيفة', '16:00'),
            createMockMeal('m7', 'Dinner', 'عشاء', '19:00'),
        ],
        isActive: true,
        usageCount: 45,
        mealsCount: 4,
        createdAt: Date.now() - 5000000,
    },
    {
        id: 'dp3',
        _id: 'dp3',
        name: 'Low Carb Classic',
        nameAr: 'كلاسيك منخفض الكربوهيدرات',
        description: 'Reduced carb intake for steady weight loss.',
        type: 'low_carb',
        emoji: '🥩',
        targetCalories: 1400,
        tags: ['weight_loss'],
        meals: [],
        isActive: true,
        usageCount: 88,
        mealsCount: 0,
        createdAt: Date.now() - 2000000,
    },
];

// --- MOCK ACTIVE PLANS (DoctorPlanItem) ---
export const MOCK_ACTIVE_PLANS: DoctorPlanItem[] = [
    {
        id: 'wp1',
        clientId: 'u1',
        clientName: 'Ahmed Ali',
        avatar: 'https://i.pravatar.cc/150?u=1',
        clientGoal: 'weight_loss',
        dietProgram: 'Standard Keto',
        daysLeft: 5,
        weekNumber: 2,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        mealsCompleted: 15,
        totalMeals: 21,
        weightChange: -1.5,
        status: 'good',
        statusMessage: null,
        missedMeals: 1,
        weekStartDate: new Date().toISOString(),
        weekEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        planStatus: 'active',
    },
    {
        id: 'wp2',
        clientId: 'u2',
        clientName: 'Sara Ahmed',
        avatar: 'https://i.pravatar.cc/150?u=2',
        clientGoal: 'maintain',
        dietProgram: 'Vegan Power',
        daysLeft: 2,
        weekNumber: 4,
        startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        mealsCompleted: 10,
        totalMeals: 28,
        weightChange: 0.2,
        status: 'warning',
        statusMessage: 'Missed 3 meals this week',
        missedMeals: 3,
        weekStartDate: new Date().toISOString(),
        weekEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        planStatus: 'active',
    },
];

// --- MOCK DRAFT PLANS ---
export const MOCK_DRAFT_PLANS: DraftPlanItem[] = [
    {
        id: 'wp_draft_1',
        title: 'Draft for Mahmoud',
        basedOn: 'Standard Keto',
        lastEditedHours: 2,
        progressPercent: 60,
        clientId: 'u3',
    }
];

// --- MOCK ASSIGNMENT CLIENTS ---
export const MOCK_ASSIGNMENT_CLIENTS: AssignmentClient[] = [
    {
        id: 'u4',
        name: 'Mahmoud Hassan',
        avatar: null,
        goal: 'gain_muscle',
        hasActivePlan: false,
        currentPlanName: null,
    },
    {
        id: 'u5',
        name: 'Laila Youssef',
        avatar: 'https://i.pravatar.cc/150?u=5',
        goal: 'weight_loss',
        hasActivePlan: true,
        currentPlanName: 'Low Carb Classic',
    }
];

// --- MOCK DIET PROGRAMS (Templates) ---
export const MOCK_DIET_PROGRAMS: DietProgramItem[] = MOCK_DIET_PLANS.map(plan => ({
    id: plan.id,
    name: plan.name,
    nameAr: plan.nameAr,
    emoji: plan.emoji,
    type: plan.type,
    targetGoal: plan.tags?.includes('weight_loss') ? 'weight_loss' : 'maintain',
    targetCalories: plan.targetCalories,
    description: plan.description,
    tags: plan.tags || [],
}));

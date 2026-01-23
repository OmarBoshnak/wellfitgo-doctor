import { DoctorPlanItem, DraftPlanItem, AssignmentClient, DietProgramItem } from '../hooks/useDoctorPlans';
import { DietCategory } from '../hooks/useDietCategories';
import { DietPlan } from '../hooks/useDietsByType';

// Mock Active Plans
export const MOCK_ACTIVE_PLANS: DoctorPlanItem[] = [
    {
        id: "plan_1",
        clientId: "user_1",
        clientName: "Sarah Ahmed",
        avatar: "https://i.pravatar.cc/150?u=sarah",
        clientGoal: "weight_loss",
        dietProgram: "Keto Advanced",
        daysLeft: 12,
        weekNumber: 2,
        startDate: "2024-01-10",
        mealsCompleted: 15,
        totalMeals: 21,
        weightChange: -2.5,
        status: "good",
        statusMessage: "On track",
        missedMeals: 0,
        weekStartDate: "2024-01-17",
        weekEndDate: "2024-01-24",
        planStatus: "active"
    },
    {
        id: "plan_2",
        clientId: "user_2",
        clientName: "Mohamed Aly",
        avatar: "https://i.pravatar.cc/150?u=mohamed",
        clientGoal: "gain_muscle",
        dietProgram: "High Protein Build",
        daysLeft: 5,
        weekNumber: 4,
        startDate: "2023-12-25",
        mealsCompleted: 10,
        totalMeals: 21,
        weightChange: 1.2,
        status: "warning",
        statusMessage: "Missed recent meals",
        missedMeals: 4,
        weekStartDate: "2024-01-17",
        weekEndDate: "2024-01-24",
        planStatus: "active"
    }
];

// Mock Draft Plans
export const MOCK_DRAFT_PLANS: DraftPlanItem[] = [
    {
        id: "draft_1",
        title: "Keto Plan for Ahmed",
        basedOn: "Keto Standard",
        lastEditedHours: 2,
        progressPercent: 80,
        clientId: "user_3"
    },
    {
        id: "draft_2",
        title: "Vegan Adjustments",
        basedOn: "Vegan Clean",
        lastEditedHours: 24,
        progressPercent: 45,
        clientId: "user_4"
    }
];

// Mock Clients for Assignment
export const MOCK_ASSIGNMENT_CLIENTS: AssignmentClient[] = [
    {
        id: "user_3",
        name: "Ahmed Hassan",
        avatar: "https://i.pravatar.cc/150?u=ahmed",
        goal: "weight_loss",
        hasActivePlan: false,
        currentPlanName: null
    },
    {
        id: "user_4",
        name: "Laila Mahmoud",
        avatar: "https://i.pravatar.cc/150?u=laila",
        goal: "maintain",
        hasActivePlan: true,
        currentPlanName: "Maintenance Basic"
    },
    {
        id: "user_5",
        name: "Omar Khaled",
        avatar: null,
        goal: "gain_muscle",
        hasActivePlan: false,
        currentPlanName: null
    }
];

// Mock Diet Categories
export const MOCK_DIET_CATEGORIES: DietCategory[] = [
    {
        _id: "cat_1",
        id: "keto",
        name: "Keto",
        nameAr: "كيتو",
        emoji: "🥑",
        description: "Low carb, high fat diet",
        type: "system",
        dietCount: 5
    },
    {
        _id: "cat_2",
        id: "vegan",
        name: "Vegan",
        nameAr: "نباتي",
        emoji: "🥬",
        description: "Plant-based nutrition",
        type: "system",
        dietCount: 3
    },
    {
        _id: "cat_3",
        id: "intermittent_fasting",
        name: "Intermittent Fasting",
        nameAr: "الصيام المتقطع",
        emoji: "⏰",
        description: "Timed eating windows",
        type: "system",
        dietCount: 2
    },
    {
        _id: "cat_4",
        id: "high_protein",
        name: "High Protein",
        nameAr: "بروتين عالي",
        emoji: "🥩",
        description: "Muscle building focus",
        type: "system",
        dietCount: 4
    }
];

// Mock Diet Programs
export const MOCK_DIET_PROGRAMS: DietProgramItem[] = [
    {
        id: "prog_1",
        name: "Keto Standard",
        nameAr: "كيتو قياسي",
        emoji: "🥑",
        type: "keto",
        targetGoal: "weight_loss",
        targetCalories: 1500,
        description: "Standard ketogenic diet for weight loss",
        tags: ["Low Carb", "Weight Loss"]
    },
    {
        id: "prog_2",
        name: "Muscle Builder",
        nameAr: "بناء العضلات",
        emoji: "💪",
        type: "high_protein",
        targetGoal: "gain_muscle",
        targetCalories: 2500,
        description: "High protein meal plan for hypertrophy",
        tags: ["High Protein", "Muscle"]
    }
];

// Mock Full Diet Plans (for search/details)
export const MOCK_DIET_PLANS: DietPlan[] = [
    {
        id: "prog_1",
        _id: "prog_1",
        name: "Keto Standard",
        nameAr: "كيتو قياسي",
        description: "Standard ketogenic diet for weight loss",
        type: "keto",
        emoji: "🥑",
        targetCalories: 1500,
        tags: ["Low Carb", "Weight Loss"],
        isActive: true,
        usageCount: 120,
        mealsCount: 21,
        format: 'daily',
        meals: [], // Detailed meals would go here
    },
    {
        id: "prog_2",
        _id: "prog_2",
        name: "Muscle Builder",
        nameAr: "بناء العضلات",
        description: "High protein meal plan for hypertrophy",
        type: "high_protein",
        emoji: "💪",
        targetCalories: 2500,
        tags: ["High Protein", "Muscle"],
        isActive: true,
        usageCount: 85,
        mealsCount: 28,
        format: 'daily',
        meals: [],
    }
];

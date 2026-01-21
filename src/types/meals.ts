export interface MealOption {
    id: string;
    text: string;
    selected: boolean;
}

export interface MealCategory {
    id: string;
    name: string;
    nameAr?: string;
    emoji?: string;
    options: MealOption[];
}

export interface Meal {
    id: string;
    dailyId?: string;
    emoji?: string;
    name: string;
    nameAr?: string;
    note?: string;
    noteAr?: string;
    isCompleted: boolean;
    completedAt?: string;
    categories: MealCategory[];
    completed: boolean; // Added based on usage in MealsScreen logic
    total?: number; // Added for calendar logic
}

export interface Plan {
    format: 'daily' | 'general';
    name: string;
    nameAr?: string;
    emoji?: string;
    tags?: string[];
    description?: string;
    descriptionAr?: string;
    startDate: string;
    generalNotes?: string;
    generalNotesAr?: string;
}

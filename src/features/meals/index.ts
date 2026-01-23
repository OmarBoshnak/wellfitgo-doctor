// Meals feature - meal plans management
export { default as DietCategoriesGrid } from './components/DietCategoriesGrid';
export { default as DietPlansList } from './components/DietPlansList';
export { default as ActivePlansList } from './components/ActivePlansList';
export { default as DietDetailsView } from './components/DietDetailsView';
export { default as AssignClientModal } from './components/AssignClientModal';
export { default as EditDietScreen } from './components/EditDietScreen';
export { default as CreateDietScreen } from './components/CreateDietScreen';
export { default as CreateCategoryModal } from './components/CreateCategoryModal';

// Hooks
export { useDoctorPlans, isDietPlanRecommended } from './hooks/useDoctorPlans';
export type { DoctorPlanItem, DraftPlanItem, AssignmentClient, DietProgramItem } from './hooks/useDoctorPlans';
export { useDietCategories } from './hooks/useDietCategories';
export type { DietCategory } from './hooks/useDietCategories';
export { useDietsByType } from './hooks/useDietsByType';
export type { DietPlan, DietType } from './hooks/useDietsByType';
export { useDietDetails } from './hooks/useDietDetails';
export { usePlanMutations, usePlanMutations as useDoctorPlansMutations } from './hooks/usePlanMutations';
export type { DietPlanType, CreateDietPlanArgs, UpdateDietPlanArgs } from './hooks/usePlanMutations';

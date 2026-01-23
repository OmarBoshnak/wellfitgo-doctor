import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
    DietPlansList,
    DietDetailsView,
    EditDietScreen,
    CreateDietScreen,
    AssignClientModal,
} from '@/src/features/meals';
import { colors } from '@/src/core/constants/Theme';
import { horizontalScale } from '@/src/core/utils/scaling';

type ViewType = 'list' | 'details' | 'edit' | 'create';

export default function DietPlansScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Parse category from params
    const category = {
        id: params.categoryId as string,
        name: params.categoryName as string,
        nameAr: params.categoryNameAr as string,
        emoji: params.categoryEmoji as string,
    };

    const [view, setView] = useState<ViewType>('list');
    const [selectedDiet, setSelectedDiet] = useState<any>(null);
    const [createParams, setCreateParams] = useState<{ id: string; type: string } | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);

    const handleBack = () => {
        if (view === 'list') {
            router.back();
        } else if (view === 'details' || view === 'edit' || view === 'create') {
            setView('list');
            setSelectedDiet(null);
            setCreateParams(null);
        }
    };

    const handleAssign = (diet?: any) => {
        if (diet) setSelectedDiet(diet);
        setShowAssignModal(true);
    };

    const handleAssignComplete = (selectedClients: string[]) => {
        console.log('Assigned diet to clients:', selectedClients);
        setShowAssignModal(false);
        setView('list');
    };

    const handleViewDetails = (diet: any) => {
        setSelectedDiet(diet);
        setView('details');
    };

    const handleEditDiet = (diet: any) => {
        setSelectedDiet(diet);
        setView('edit');
    };

    const handleCreateNew = (categoryId: string, categoryType: string) => {
        setCreateParams({ id: categoryId, type: categoryType });
        setView('create');
    };

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.content}>
                {view === 'list' && (
                    <DietPlansList
                        category={category}
                        onBack={handleBack}
                        onAssign={handleAssign}
                        onView={handleViewDetails}
                        onEdit={handleEditDiet}
                        onCreateNew={handleCreateNew}
                    />
                )}

                {view === 'details' && selectedDiet && (
                    <DietDetailsView
                        dietId={selectedDiet.id}
                        onBack={handleBack}
                        onAssign={() => handleAssign(selectedDiet)}
                    />
                )}

                {view === 'edit' && selectedDiet && (
                    <EditDietScreen
                        dietId={selectedDiet.id}
                        onBack={handleBack}
                        onSave={() => {
                            setView('list');
                            // potentially trigger refetch via context or params if needed
                        }}
                    />
                )}

                {view === 'create' && createParams && (
                    <CreateDietScreen
                        categoryId={createParams.id}
                        categoryType={createParams.type as any}
                        onBack={handleBack}
                        onSave={() => {
                            setView('list');
                        }}
                    />
                )}
            </View>

            <AssignClientModal
                visible={showAssignModal}
                diet={selectedDiet}
                onClose={() => setShowAssignModal(false)}
                onAssign={handleAssignComplete}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    content: {
        flex: 1,
    }
});

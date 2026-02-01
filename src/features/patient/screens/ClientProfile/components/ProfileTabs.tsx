import React from 'react';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {gradients} from '@/src/core/constants/Theme';
import {isRTL} from '@/src/core/constants/translation';
import {styles} from '../styles';
import {Tab, TabType} from '../types';

interface ProfileTabsProps {
    tabs: Tab[];
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export function ProfileTabs({tabs, activeTab, onTabChange}: ProfileTabsProps) {
    return (
        <View style={styles.tabsContainer}>
            <FlatList
                horizontal
                inverted
                data={tabs}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.tabsScroll, {flexDirection: isRTL ? 'row' : 'row-reverse'}]}
                renderItem={({item: tab}) => (
                    <TouchableOpacity
                        onPress={() => onTabChange(tab.id)}
                        style={styles.tab}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === tab.id && styles.tabTextActive,
                        ]}>
                            {tab.label}
                        </Text>
                        {activeTab === tab.id && (
                            <LinearGradient
                                colors={gradients.primary}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={styles.tabIndicator}
                            />
                        )}
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

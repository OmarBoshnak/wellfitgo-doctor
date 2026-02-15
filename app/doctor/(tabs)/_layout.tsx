import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Users, UtensilsCrossed, MessageSquare, BarChart3, Home } from 'lucide-react-native';
import { colors } from '@/src/core/constants/Theme';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { useUnreadCount } from '@/src/features/messaging';
import { SocketService } from '@/src/shared/services/socket/socket.service';

// Tab labels
const tabLabels = {
    index: isRTL ? 'الرئيسية' : 'Home',
    clients: isRTL ? 'العملاء' : 'Clients',
    plans: isRTL ? 'الخطط' : 'Plans',
    messages: isRTL ? 'الرسائل' : 'Messages',
    analytics: isRTL ? 'الإحصائيات' : 'Stats',
};

// Badge component for notifications
function TabBadge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
        <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
    );
}

// Messages tab icon with real-time unread count
function MessagesTabIcon({ color, size }: { color: string; size: number }) {
    const unreadCount = useUnreadCount();

    return (
        <View>
            <MessageSquare size={horizontalScale(size)} color={color} />
            <TabBadge count={unreadCount} />
        </View>
    );
}

export default function TabsLayout() {
    useEffect(() => {
        let mounted = true;

        console.log('[TabsLayout] Initiating socket connection...');
        SocketService.connect()
            .then(() => {
                if (mounted) {
                    console.log('[TabsLayout] Socket connection initiated successfully');
                }
            })
            .catch((error) => {
                console.warn('[TabsLayout] Socket connection failed:', error);
                // Even on error, allow the app to continue (will work without real-time)
            });

        return () => {
            mounted = false;
            console.log('[TabsLayout] Disconnecting sockets...');
            SocketService.disconnect();
        };
    }, []);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primaryDark,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.white,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    paddingTop: verticalScale(8),
                    paddingBottom: Platform.OS === 'ios' ? verticalScale(15) : verticalScale(8),
                    height: Platform.OS === 'ios' ? verticalScale(70) : verticalScale(65),
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="analytics"
                options={{
                    title: tabLabels.analytics,
                    tabBarIcon: ({ color, size }) => <BarChart3 size={horizontalScale(size)} color={color} />,
                }}
            />

            <Tabs.Screen
                name="messages"
                options={{
                    title: tabLabels.messages,
                    tabBarIcon: ({ color, size }) => <MessagesTabIcon color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="clients"
                options={{
                    title: tabLabels.clients,
                    tabBarIcon: ({ color, size }) => <Users size={horizontalScale(size)} color={color} />,
                }}
            />

            <Tabs.Screen
                name="plans"
                options={{
                    title: tabLabels.plans,
                    tabBarIcon: ({ color, size }) => <UtensilsCrossed size={horizontalScale(size)} color={color} />,
                }}
            />

            <Tabs.Screen
                name="home"
                options={{
                    title: tabLabels.index,
                    tabBarIcon: ({ color, size }) => <Home size={horizontalScale(size)} color={color} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        top: verticalScale(-4),
        right: horizontalScale(-8),
        backgroundColor: colors.error,
        borderRadius: horizontalScale(10),
        minWidth: horizontalScale(18),
        height: horizontalScale(18),
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: horizontalScale(4),
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
    },
});

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { ChatMessage } from './types';
import MessageBubble from './MessageBubble';
import { colors } from '@/src/core/constants/Theme';

// Arabic translations
const t = {
    today: 'اليوم',
    loadingMore: 'جاري تحميل المزيد...',
};

interface Props {
    messages: ChatMessage[];
    avatarUri?: string;
    onMessageLongPress?: (message: ChatMessage) => void;
    // Pagination props
    hasMoreMessages?: boolean;
    isLoadingMore?: boolean;
    onLoadMore?: () => void;
}

const MessageList = React.memo(function MessageList({
    messages,
    avatarUri,
    onMessageLongPress,
    hasMoreMessages = false,
    isLoadingMore = false,
    onLoadMore,
}: Props) {
    const flatListRef = useRef<FlatList>(null);
    const [prevMessagesLength, setPrevMessagesLength] = useState(0);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // Auto-scroll to bottom only when new messages arrive at the end (not during pagination)
    useEffect(() => {
        if (messages.length > prevMessagesLength && shouldAutoScroll) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
        setPrevMessagesLength(messages.length);
    }, [messages.length, prevMessagesLength, shouldAutoScroll]);

    // Scroll detection for loading more messages
    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const isNearTop = contentOffset.y < 100;
        const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;

        // Update auto-scroll behavior based on scroll position
        setShouldAutoScroll(isNearBottom);

        // Trigger load more when near top
        if (isNearTop && hasMoreMessages && !isLoadingMore) {
            onLoadMore?.();
        }
    }, [hasMoreMessages, isLoadingMore, onLoadMore]);

    const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
        // Determine if we should show avatar (first message or different sender)
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showAvatar = !prevMessage ||
            prevMessage.sender !== item.sender ||
            prevMessage.type === 'system';

        return (
            <MessageBubble
                message={item}
                showAvatar={showAvatar && item.sender === 'client'}
                avatarUri={avatarUri}
                onLongPress={onMessageLongPress}
            />
        );
    };

    // Loading indicator at top during pagination
    const renderLoadingHeader = () => (
        <View>
            {isLoadingMore && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>{t.loadingMore}</Text>
                </View>
            )}
            <View style={styles.header}>
                <Text style={styles.dateSeparator}>{t.today}</Text>
            </View>
        </View>
    );

    const keyExtractor = (item: ChatMessage) => item.id;

    return (
        <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={renderLoadingHeader}
            style={styles.list}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
            }}
        />
    );
});

export default MessageList;

const styles = StyleSheet.create({
    list: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    contentContainer: {
        paddingVertical: verticalScale(16),
        paddingBottom: verticalScale(8),
    },
    header: {
        alignItems: 'center',
        paddingVertical: verticalScale(8),
        marginBottom: verticalScale(8),
    },
    dateSeparator: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#AAB8C5',
    },
    loadingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: verticalScale(12),
        gap: horizontalScale(8),
    },
    loadingText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
});

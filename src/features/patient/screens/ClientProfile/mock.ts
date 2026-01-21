import { isRTL } from '@/src/core/constants/translation';

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    location: string;
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    startDate: string;
    weeklyChange: number;
}

export interface Activity {
    id: string;
    type: 'weight' | 'meals' | 'message' | 'missed' | 'water';
    color: string;
    date: string;
    text: string;
    subtext: string;
}

export const mockClient: Client = {
    id: '1',
    name: isRTL ? 'أحمد حسن' : 'Ahmed Hassan',
    email: 'ahmed.hassan@email.com',
    phone: '+20 123 456 7890',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIBJHIHfGzMFevBVlI8thVMwxmrIx6v9alnXeexmEFR0cswXJDtmn9GXA8P_7_QSdy6OCpiFjPckR_Agi-3go4metlZaNw2xbtAQX2S-g0VFWTtDZyJtKEDkgEHiKJMl8EGLiWFLH7YH82VadqV_6673zBycEQu9Z-RodFMIrPBGFej8SO1aQnl-f72Zrykb6joVgoXC9pzihNSVO_MDvhmwKsFFmAMhyblydxKyf1sYDXvJeznSBAiZu6ZGMQO8y3Q3SBvU-M9DA',
    location: isRTL ? 'القاهرة، مصر' : 'Cairo, Egypt',
    startWeight: 75,
    currentWeight: 68,
    targetWeight: 60,
    startDate: isRTL ? 'نوف 25' : 'Nov 25',
    weeklyChange: -0.8,
};

export const mockActivity: Activity[] = [
    {
        id: '1',
        type: 'weight',
        color: '#60A5FA',
        date: isRTL ? '6 ديس • 08:30 ص' : 'Dec 6 • 08:30 AM',
        text: isRTL ? 'سجل الوزن: 68.0 كجم' : 'Logged weight: 68.0 kg',
        subtext: isRTL ? '😊 أسبوع جيد' : '😊 Good week',
    },
    {
        id: '2',
        type: 'meals',
        color: '#27AE61',
        date: isRTL ? '5 ديس • 07:15 م' : 'Dec 5 • 07:15 PM',
        text: isRTL ? 'أكمل جميع الوجبات ✓' : 'Completed all meals ✓',
        subtext: '',
    },
    {
        id: '3',
        type: 'message',
        color: '#5073FE',
        date: isRTL ? '4 ديس • 02:45 م' : 'Dec 4 • 02:45 PM',
        text: isRTL ? 'أرسل رسالة' : 'Sent message',
        subtext: isRTL ? '"عن بدائل العشاء..."' : '"About dinner alternatives..."',
    },
    {
        id: '4',
        type: 'missed',
        color: '#FBBF24',
        date: isRTL ? '3 ديس • 10:00 ص' : 'Dec 3 • 10:00 AM',
        text: isRTL ? 'فاتته جلسة التمرين' : 'Missed workout session',
        subtext: '',
    },
    {
        id: '5',
        type: 'water',
        color: '#27AE61',
        date: isRTL ? '2 ديس • 09:00 م' : 'Dec 2 • 09:00 PM',
        text: isRTL ? 'وصل لهدف الماء اليومي' : 'Daily water goal reached',
        subtext: '',
    },
];

export const mockMealPlans = [
    {
        id: '1',
        dietPlanId: 'diet1',
        weekStartDate: '2023-12-09',
        weekEndDate: '2023-12-15',
        status: 'active',
        mealsCompleted: 15,
        mealsTotal: 21,
        createdAt: Date.now(),
    },
    {
        id: '2',
        dietPlanId: 'diet2',
        weekStartDate: '2023-12-02',
        weekEndDate: '2023-12-08',
        status: 'completed',
        mealsCompleted: 20,
        mealsTotal: 21,
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    },
];

export const mockNotes = [
    {
        id: '1',
        content: isRTL ? 'العميل يلتزم بالنظام الغذائي بشكل جيد' : 'Client is adhering to the diet plan well.',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    {
        id: '2',
        content: isRTL ? 'يحتاج إلى زيادة شرب الماء' : 'Needs to increase water intake.',
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
];

export const mockSettings = {
    subscriptionStatus: 'active',
    assignedChatDoctor: 'gehad',
    notificationSettings: {
        mealReminders: true,
        weeklyCheckin: true,
        coachMessages: true
    }
};

export const mockDoctors = [
    { _id: 'gehad', firstName: isRTL ? 'جيهاد' : 'Gehad', lastName: '', role: 'coach' },
    { _id: 'mostafa', firstName: isRTL ? 'مصطفى' : 'Mostafa', lastName: '', role: 'coach' },
];

export const mockCurrentUser = {
    role: 'admin', // Or 'coach'
};


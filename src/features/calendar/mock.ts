export const mockEvents = [
    {
        _id: '1',
        date: '2023-12-09', // Note: This will need to be dynamic to show up in "current week"
        startTime: '10:00',
        endTime: '10:30',
        reason: 'Monthly Check-in',
        notes: 'Review progress',
        clientName: 'Ahmed Hassan',
        clientId: '1',
        clientPhone: '+201234567890',
    },
    {
        _id: '2',
        date: '2023-12-10',
        startTime: '14:00',
        endTime: '15:00',
        reason: 'Diet Plan Consultation',
        notes: 'Discuss new plan',
        clientName: 'Sara Ali',
        clientId: '2',
        clientPhone: '+201234567891',
    },
    {
        _id: '3',
        date: '2023-12-11',
        startTime: '09:00',
        endTime: '09:30',
        reason: 'Quick Follow-up',
        notes: '',
        clientName: 'Mohamed Mahmoud',
        clientId: '3',
        clientPhone: '+201234567892',
    }
];

export const mockClients = [
    { _id: '1', firstName: 'Ahmed', lastName: 'Hassan', phone: '+201234567890' },
    { _id: '2', firstName: 'Sara', lastName: 'Ali', phone: '+201234567891' },
    { _id: '3', firstName: 'Mohamed', lastName: 'Mahmoud', phone: '+201234567892' },
];

// Helper to generate dynamic mock events for the current week
export const getDynamicMockEvents = (startDate: string, endDate: string) => {
    // Generate some events relative to Today
    const today = new Date();
    const isoToday = today.toISOString().split('T')[0];

    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isoTomorrow = tomorrow.toISOString().split('T')[0];

    return [
        {
            _id: '1',
            date: isoToday,
            startTime: '10:00',
            endTime: '10:30',
            reason: 'Monthly Check-in',
            notes: 'Review progress',
            clientName: 'Ahmed Hassan',
            clientId: '1',
            clientPhone: '+201234567890',
        },
        {
            _id: '2',
            date: isoToday,
            startTime: '14:00',
            endTime: '15:00',
            reason: 'Diet Plan Consultation',
            notes: 'Discuss new plan',
            clientName: 'Sara Ali',
            clientId: '2',
            clientPhone: '+201234567891',
        },
        {
            _id: '3',
            date: isoTomorrow,
            startTime: '09:00',
            endTime: '09:30',
            reason: 'Quick Follow-up',
            notes: 'Urgent',
            clientName: 'Mohamed Mahmoud',
            clientId: '3',
            clientPhone: '+201234567892',
        }
    ];
};

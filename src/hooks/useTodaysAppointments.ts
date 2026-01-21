/**
 * Today's Appointments Hook - Node.js Backend
 * 
 * Fetches today's appointments for the doctor
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { isRTL } from '../i18n';

// ============ TYPES ============
export interface AppointmentDisplay {
    id: string;
    time: string;
    type: "video" | "phone";
    clientName: string;
    clientId: string;
    avatar: string;
    duration: string;
    status: "upcoming" | "starting_soon" | "in_progress";
    reason?: string;
    rawStartTime: string;
    clientPhone?: string;
}

export interface UseTodaysAppointmentsResult {
    appointments: AppointmentDisplay[];
    isLoading: boolean;
    error?: Error;
    isEmpty: boolean;
    totalToday: number;
    nextAppointment: AppointmentDisplay | null;
    refetch: () => void;
}

// ============ HELPER FUNCTIONS ============

function formatTime12Hour(time24: string): string {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? (isRTL ? "م" : "PM") : (isRTL ? "ص" : "AM");
    const hour12 = hours % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatDuration(minutes: number): string {
    return isRTL ? `${minutes} دقيقة` : `${minutes} min`;
}

function calculateStatus(startTime: string, endTime: string, date: string): "upcoming" | "starting_soon" | "in_progress" {
    const now = new Date();
    const [year, month, day] = date.split("-").map(Number);
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const startDate = new Date(year, month - 1, day, startH, startM);
    const endDate = new Date(year, month - 1, day, endH, endM);

    if (now >= startDate && now < endDate) return "in_progress";

    const minutesUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60);
    if (minutesUntilStart <= 15 && minutesUntilStart > 0) return "starting_soon";

    return "upcoming";
}

// ============ MAIN HOOK ============
export function useTodaysAppointments(limit?: number): UseTodaysAppointmentsResult {
    const [appointments, setAppointments] = useState<AppointmentDisplay[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const today = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const fetchAppointments = useCallback(async () => {
        try {
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setIsLoading(false);
        }
    }, [getToken, today, limit]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const nextAppointment = appointments.find(
        apt => apt.status === "starting_soon" || apt.status === "upcoming"
    ) || null;

    return {
        appointments,
        isLoading,
        isEmpty: appointments.length === 0,
        totalToday: appointments.length,
        nextAppointment,
        refetch: fetchAppointments,
    };
}

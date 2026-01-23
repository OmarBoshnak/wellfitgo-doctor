/**
 * Appointment Service
 * @description Service for calendar appointment CRUD operations
 */

import api from './api/client';

// Types matching backend response
export interface CalendarAppointment {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
    notes?: string;
    clientName: string;
    clientId: string;
    clientPhone?: string;
}

export interface CreateAppointmentData {
    clientId: string;
    clientName: string;
    clientPhone?: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
    type?: 'consultation' | 'checkin' | 'followup';
}

export interface UpdateAppointmentData {
    date?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

// API Functions
export const appointmentService = {
    /**
     * Get appointments by date range
     */
    async getAppointments(startDate: string, endDate: string): Promise<CalendarAppointment[]> {
        try {
            console.log('[AppointmentService] Fetching appointments for:', `/doctors/appointments?startDate=${startDate}&endDate=${endDate}`); // DEBUG
            const response = await api.get(`/doctors/appointments?startDate=${startDate}&endDate=${endDate}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch appointments');
        } catch (error) {
            console.error('[AppointmentService] Error fetching appointments:', error);
            return [];
        }
    },

    /**
     * Create a new appointment
     */
    async createAppointment(data: CreateAppointmentData): Promise<CalendarAppointment | null> {
        try {
            const response = await api.post('/doctors/appointments', data);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to create appointment');
        } catch (error) {
            console.error('[AppointmentService] Error creating appointment:', error);
            throw error;
        }
    },

    /**
     * Update an existing appointment
     */
    async updateAppointment(id: string, data: UpdateAppointmentData): Promise<CalendarAppointment | null> {
        try {
            const response = await api.put(`/doctors/appointments/${id}`, data);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to update appointment');
        } catch (error) {
            console.error('[AppointmentService] Error updating appointment:', error);
            throw error;
        }
    },

    /**
     * Delete (cancel) an appointment
     */
    async deleteAppointment(id: string): Promise<boolean> {
        try {
            const response = await api.delete(`/doctors/appointments/${id}`);
            return response.data.success;
        } catch (error) {
            console.error('[AppointmentService] Error deleting appointment:', error);
            throw error;
        }
    },

    /**
     * Get doctor's clients for appointment creation
     */
    async getClients(): Promise<{ _id: string; firstName: string; lastName: string; phone?: string }[]> {
        try {
            const response = await api.get('/doctors/clients');
            if (response.data.success) {
                // Backend returns { clients: [], counts: {}, ... }
                return response.data.data.clients || [];
            }
            throw new Error(response.data.message || 'Failed to fetch clients');
        } catch (error) {
            console.error('[AppointmentService] Error fetching clients:', error);
            return [];
        }
    },
};

export default appointmentService;

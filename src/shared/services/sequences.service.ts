/**
 * Sequences Service
 * @description Service for automation sequences CRUD and enrollment management
 */

import api from './api/client';

// ---- Types ----

export type SendDay = 'any' | 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface SequenceStep {
    stepOrder: number;
    type: 'message' | 'condition';
    // Message step fields
    messageContent?: string;
    messageContentAr?: string;
    delayDays?: number;
    sendWindowStartHour?: number;
    sendWindowStartMinute?: number;
    sendWindowEndHour?: number;
    sendWindowEndMinute?: number;
    sendDay?: SendDay | SendDay[];
    isActive?: boolean;
    // Condition step fields
    conditionField?: string;
    conditionOperator?: 'eq' | 'neq' | 'gt' | 'lt' | 'exists';
    conditionValue?: string;
    trueBranch?: number;
    falseBranch?: number;
}

export interface Sequence {
    _id: string;
    name: string;
    triggerEvent: string;
    isActive: boolean;
    createdBy: string;
    clientIds?: string[];
    steps: SequenceStep[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateSequenceData {
    name: string;
    triggerEvent: string;
    isActive?: boolean;
    clientIds?: string[];
    steps?: SequenceStep[];
}

export interface UpdateSequenceData {
    name?: string;
    triggerEvent?: string;
    isActive?: boolean;
    clientIds?: string[];
    steps?: SequenceStep[];
}

export interface SequenceEnrollment {
    _id: string;
    sequenceId: { _id: string; name: string; triggerEvent: string } | string;
    clientId: { _id: string; firstName: string; lastName: string; email: string } | string;
    doctorId: string;
    conversationId: string;
    status: 'active' | 'completed' | 'cancelled';
    currentStepOrder: number;
    nextRunAt: string;
    triggerPayload?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface SequenceEventLog {
    _id: string;
    enrollmentId: string;
    sequenceId: string;
    clientId: string;
    stepOrder: number;
    stepType: 'message' | 'delay' | 'condition';
    result: 'sent' | 'skipped_dnd' | 'condition_true' | 'condition_false' | 'error';
    errorMessage?: string;
    createdAt: string;
}

// ---- API ----

export const sequencesService = {
    /** List all sequences */
    async listSequences(): Promise<Sequence[]> {
        const response = await api.get('/sequences');
        if (response.data.success) return response.data.data;
        throw new Error(response.data.message || 'Failed to list sequences');
    },

    /** Get a single sequence by ID */
    async getSequence(id: string): Promise<Sequence> {
        const response = await api.get(`/sequences/${id}`);
        if (response.data.success) return response.data.data;
        throw new Error(response.data.message || 'Failed to get sequence');
    },

    /** Create a new sequence */
    async createSequence(data: CreateSequenceData): Promise<Sequence> {
        const response = await api.post('/sequences', data);
        if (response.data.success) return response.data.data;
        throw new Error(response.data.message || 'Failed to create sequence');
    },

    /** Update an existing sequence */
    async updateSequence(id: string, data: UpdateSequenceData): Promise<Sequence> {
        const response = await api.put(`/sequences/${id}`, data);
        if (response.data.success) return response.data.data;
        throw new Error(response.data.message || 'Failed to update sequence');
    },

    /** Delete a sequence */
    async deleteSequence(id: string): Promise<void> {
        const response = await api.delete(`/sequences/${id}`);
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to delete sequence');
        }
    },

    /** Manually enroll a client in a sequence */
    async enrollClient(sequenceId: string, clientId: string): Promise<void> {
        const response = await api.post(`/sequences/${sequenceId}/enroll`, { clientId });
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to enroll client');
        }
    },

    /** List enrollments with optional filters */
    async listEnrollments(params?: {
        clientId?: string;
        status?: string;
        sequenceId?: string;
    }): Promise<SequenceEnrollment[]> {
        const query = new URLSearchParams();
        if (params?.clientId) query.append('clientId', params.clientId);
        if (params?.status) query.append('status', params.status);
        if (params?.sequenceId) query.append('sequenceId', params.sequenceId);
        const response = await api.get(`/sequences/enrollments?${query.toString()}`);
        if (response.data.success) return response.data.data;
        throw new Error(response.data.message || 'Failed to list enrollments');
    },

    /** Cancel an enrollment */
    async cancelEnrollment(enrollmentId: string): Promise<SequenceEnrollment> {
        const response = await api.post(`/sequences/enrollments/${enrollmentId}/cancel`);
        if (response.data.success) return response.data.data;
        throw new Error(response.data.message || 'Failed to cancel enrollment');
    },

    /** Get logs for an enrollment */
    async getEnrollmentLogs(enrollmentId: string): Promise<SequenceEventLog[]> {
        const response = await api.get(`/sequences/enrollments/${enrollmentId}/logs`);
        if (response.data.success) return response.data.data;
        throw new Error(response.data.message || 'Failed to get logs');
    },
};

export default sequencesService;

import { useState, useEffect, useCallback } from 'react';
import sequencesService, {
    Sequence,
    SequenceEnrollment,
    CreateSequenceData,
    UpdateSequenceData,
} from '@/src/shared/services/sequences.service';

// ---- List Hook ----

export function useSequences() {
    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await sequencesService.listSequences();
            setSequences(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load sequences');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch();
    }, [fetch]);

    const deleteSequence = useCallback(async (id: string) => {
        await sequencesService.deleteSequence(id);
        setSequences(prev => prev.filter(s => s._id !== id));
    }, []);

    return { sequences, loading, error, refetch: fetch, deleteSequence };
}

// ---- Single Sequence Hook ----

export function useSequence(id: string | null) {
    const [sequence, setSequence] = useState<Sequence | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        sequencesService
            .getSequence(id)
            .then(data => {
                if (!cancelled) setSequence(data);
            })
            .catch(e => {
                if (!cancelled) setError(e.message || 'Failed to load sequence');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [id]);

    return { sequence, loading, error };
}

// ---- Save Sequence Hook ----

export function useSaveSequence() {
    const [saving, setSaving] = useState(false);

    const save = useCallback(async (id: string | null, data: CreateSequenceData | UpdateSequenceData): Promise<Sequence> => {
        setSaving(true);
        try {
            if (id) {
                return await sequencesService.updateSequence(id, data);
            }
            return await sequencesService.createSequence(data as CreateSequenceData);
        } finally {
            setSaving(false);
        }
    }, []);

    return { save, saving };
}

// ---- Enrollments Hook ----

export function useEnrollments(sequenceId?: string) {
    const [enrollments, setEnrollments] = useState<SequenceEnrollment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const data = await sequencesService.listEnrollments(
                sequenceId ? { sequenceId } : undefined
            );
            setEnrollments(data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [sequenceId]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { enrollments, loading, refetch: fetch };
}

export * from './AppointmentsSection';
export * from './ClientsAttentionSection';
export { default as DoctorHeader } from './DoctorHeader';
export * from './NotificationPanel';
export * from './RecentActivitySection';
export * from './StatsGrid';
export * from './WeeklyActivitySection';
// export type { Appointment, Activity } from './RecentActivitySection'; // Removed as they are exported by * from their respective files
// Note: If types are not exported from files, we might need to verify. 
// For now, exporting * is safe for components.

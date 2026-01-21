import api from '../api/client';
import { Platform } from 'react-native';

// =============================================================================
// Types
// =============================================================================

export interface DoctorProfile {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    specialization?: string;
    certifications?: string[];
    experience?: number;
    bio?: string;  // We'll use specialization as bio for now
    workingHours?: {
        timezone: string;
        days: Record<string, { enabled: boolean; from: number; to: number }>;
    };
    onboardingCompleted: boolean;
    coachProfileCompleted: boolean;
}

export interface UpdateProfileData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    specialization?: string;
    certifications?: string[];
    experience?: number;
    workingHours?: {
        timezone: string;
        days: Record<string, { enabled: boolean; from: number; to: number }>;
    };
    preferredLanguage?: 'ar' | 'en';
}

export interface UploadImageResponse {
    success: boolean;
    url: string;
    publicId?: string;
}

// =============================================================================
// Profile Service
// =============================================================================

export const ProfileService = {
    /**
     * Get the current doctor's profile
     */
    getDoctorProfile: async (): Promise<DoctorProfile> => {
        const response = await api.get<DoctorProfile>('/doctors/profile');
        return response.data;
    },

    /**
     * Update the doctor's profile
     */
    updateDoctorProfile: async (data: UpdateProfileData): Promise<DoctorProfile> => {
        const response = await api.put<DoctorProfile>('/doctors/profile', data);
        return response.data;
    },

    /**
     * Upload a profile image to Cloudinary via the backend
     * @param imageUri - Local URI of the image (from ImagePicker)
     * @returns URL of the uploaded image
     */
    uploadProfileImage: async (imageUri: string): Promise<string> => {
        const formData = new FormData();

        // Get the filename from the URI
        const uriParts = imageUri.split('/');
        const fileName = uriParts[uriParts.length - 1];

        // Determine the image type from extension
        const match = /\.(\w+)$/.exec(fileName);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // Append the file to FormData
        formData.append('image', {
            uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
            name: fileName || 'profile.jpg',
            type: type,
        } as any);

        const response = await api.post<UploadImageResponse>('/upload/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.data.success) {
            throw new Error('Failed to upload image');
        }

        return response.data.url;
    },

    /**
     * Upload profile image and update the profile with the new URL
     * @param imageUri - Local URI of the image
     * @returns Updated profile with new avatarUrl
     */
    uploadAndUpdateProfileImage: async (imageUri: string): Promise<DoctorProfile> => {
        // Upload the image
        const avatarUrl = await ProfileService.uploadProfileImage(imageUri);

        // Update the profile with the new URL
        return ProfileService.updateDoctorProfile({ avatarUrl });
    },
};

export default ProfileService;

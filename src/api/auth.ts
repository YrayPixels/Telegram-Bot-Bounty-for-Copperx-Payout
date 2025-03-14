import { apiClient, ApiResponse } from './client';

// Types for authentication
export interface EmailOtpRequestResponse {
    success: boolean;
    message: string;
}

export interface EmailOtpAuthenticateResponse {
    token: string;
    organizationId: string;
}

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    // Add more fields as needed
}

export interface KycStatus {
    id: string;
    status: string;
    type: string;
    // Add more fields as needed
}

// Authentication API methods
export const authApi = {
    // Request email OTP
    async requestEmailOtp(email: string): Promise<EmailOtpRequestResponse> {
        try {
            const response = await apiClient.post<EmailOtpRequestResponse>('/auth/email-otp/request', {
                email
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to request OTP');
        }
    },

    // Authenticate with email OTP
    async authenticateWithEmailOtp(email: string, otp: string): Promise<EmailOtpAuthenticateResponse> {
        try {
            const response = await apiClient.post<EmailOtpAuthenticateResponse>('/auth/email-otp/authenticate', {
                email,
                otp
            });

            // Set the auth token on successful authentication
            if (response.data.token) {
                apiClient.setAuthToken(response.data.token);
            }

            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Authentication failed');
        }
    },

    // Get user profile
    async getUserProfile(): Promise<UserProfile> {
        try {
            const response = await apiClient.get<UserProfile>('/auth/me');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
        }
    },

    // Get KYC status
    async getKycStatus(): Promise<KycStatus[]> {
        try {
            const response = await apiClient.get<KycStatus[]>('/kycs');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch KYC status');
        }
    },

    // Logout
    async logout(): Promise<void> {
        apiClient.clearAuthToken();
    }
};
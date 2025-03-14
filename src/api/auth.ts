import { apiClient, ApiResponse } from './client';

// Types for authentication
export interface EmailOtpRequestResponse {
    email: string,
    sid: string
}

export interface EmailOtpAuthenticateResponse {
    scheme: string,
    accessToken: string,
    accessTokenId: string,
    expireAt: string,
    user: UserProfile
}

export interface UserProfile {
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    profileImage: string,
    organizationId: string,
    role: string,
    status: string,
    type: string,
    relayerAddress: string,
    flags: [
        string
    ],
    walletAddress: string,
    walletId: string,
    walletAccountType: string,
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
            apiClient.setSid(response.data.sid);
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
                otp,
                sid: apiClient.sid,
            });

            console.log(response.data)

            // Set the auth token on successful authentication
            if (response.data.accessToken) {
                apiClient.setAuthToken(response.data.accessToken);
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
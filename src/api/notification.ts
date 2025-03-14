import { apiClient } from './client';

// Types for notifications
export interface PusherAuthRequest {
    socket_id: string;
    channel_name: string;
}

export interface PusherAuthResponse {
    auth: string;
    channel_data?: string;
}

// Notification API methods
export const notificationApi = {
    // Authenticate with Pusher
    async authenticatePusher(socketId: string, channelName: string): Promise<PusherAuthResponse> {
        try {
            const response = await apiClient.post<PusherAuthResponse>('/notifications/auth', {
                socket_id: socketId,
                channel_name: channelName
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to authenticate with Pusher');
        }
    }
};
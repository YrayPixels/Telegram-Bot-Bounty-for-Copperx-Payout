import { apiClient } from './client';

// Types for transfers
export interface Transfer {
    id: string;
    amount: string;
    currency: string;
    status: string;
    type: string;
    createdAt: string;
    fromAddress?: string;
    toAddress?: string;
    recipientEmail?: string;
    // Add more fields as needed
}

export interface EmailTransferRequest {
    email: string;
    amount: string;
    currency: string;
    description?: string;
}

export interface WalletTransferRequest {
    toAddress: string;
    amount: string;
    currency: string;
    network: string;
    description?: string;
}

export interface BankWithdrawalRequest {
    amount: string;
    currency: string;
    description?: string;
    // Add bank account details as needed
}

export interface BulkTransferRequest {
    transfers: EmailTransferRequest[];
}

export interface TransferResponse {
    id: string;
    status: string;
    // Add more fields as needed
}

// Transfer API methods
export const transferApi = {
    // Send funds to email
    async sendToEmail(data: EmailTransferRequest): Promise<TransferResponse> {
        try {
            const response = await apiClient.post<TransferResponse>('/transfers/send', data);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to send funds to email');
        }
    },

    // Send funds to external wallet
    async sendToWallet(data: WalletTransferRequest): Promise<TransferResponse> {
        try {
            const response = await apiClient.post<TransferResponse>('/transfers/wallet-withdraw', data);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to send funds to wallet');
        }
    },

    // Withdraw funds to bank account
    async withdrawToBank(data: BankWithdrawalRequest): Promise<TransferResponse> {
        try {
            const response = await apiClient.post<TransferResponse>('/transfers/offramp', data);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to withdraw funds to bank');
        }
    },

    // Send bulk transfers
    async sendBulkTransfers(data: BulkTransferRequest): Promise<TransferResponse[]> {
        try {
            const response = await apiClient.post<TransferResponse[]>('/transfers/send-batch', data);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to send bulk transfers');
        }
    },

    // Get transfer history
    async getTransferHistory(page: number = 1, limit: number = 10): Promise<Transfer[]> {
        try {
            const response = await apiClient.get<Transfer[]>(`/transfers?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch transfer history');
        }
    }
};
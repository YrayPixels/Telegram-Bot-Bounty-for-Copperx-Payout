import { apiClient } from './client';

// Types for wallet management
export interface Wallet {
    id: string;
    address: string;
    network: string;
    isDefault: boolean;
    currency: string;
    // Add more fields as needed
}




export interface WalletBalance {
    decimals: 6,
    balance: string,
    symbol: string,
    address: string
}

export interface WalletBalances {

    walletId: string,
    isDefault: boolean,
    network: string,
    balances: [
        WalletBalance
    ]

}


// Wallet API methods
export const walletApi = {
    // Get all wallets
    async getWallets(): Promise<Wallet[]> {
        try {
            const response = await apiClient.get<Wallet[]>('/wallets');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch wallets');
        }
    },

    // Get wallet balances
    async getWalletBalances(): Promise<WalletBalances[]> {
        try {
            const response = await apiClient.get<WalletBalances[]>('/wallets/balances');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch wallet balances');
        }
    },

    async getWalletBalance(): Promise<WalletBalance> {
        try {
            const response = await apiClient.get<WalletBalance>('/wallets/balance');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch wallet balances');
        }
    },

    // Set default wallet
    async setDefaultWallet(walletId: string): Promise<Wallet> {
        try {
            const response = await apiClient.put<Wallet>('/wallets/default', { walletId });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to set default wallet');
        }
    },

    // Get default wallet
    async getDefaultWallet(): Promise<Wallet> {
        try {
            const response = await apiClient.get<Wallet>('/wallets/default');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get default wallet');
        }
    }
};
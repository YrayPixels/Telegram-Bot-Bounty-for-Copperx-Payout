import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../config';

// Define interfaces for API responses
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

// Create API client class for Copperx API
export class ApiClient {
    private client: AxiosInstance;
    private authToken?: string;
    public sid?: string;

    constructor() {
        this.client = axios.create({
            baseURL: config.api.baseUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                config.logger.error('API Error:', {
                    url: error.config?.url,
                    status: error.response?.status,
                    data: error.response?.data,
                });
                return Promise.reject(error);
            }
        );
    }

    public setSid(sid: string) {
        this.sid = sid;
    }

    // Set authentication token
    public setAuthToken(token: string): void {
        this.authToken = token;
    }

    // Clear authentication token
    public clearAuthToken(): void {
        this.authToken = undefined;
    }

    // Get authentication status
    public isAuthenticated(): boolean {
        return !!this.authToken;
    }

    // Make a GET request
    public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.client.get<T>(url, this.addAuthHeader(config));
    }

    // Make a POST request
    public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.client.post<T>(url, data, this.addAuthHeader(config));
    }

    // Make a PUT request
    public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.client.put<T>(url, data, this.addAuthHeader(config));
    }

    // Make a DELETE request
    public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.client.delete<T>(url, this.addAuthHeader(config));
    }

    // Add authentication header if token exists
    private addAuthHeader(config?: AxiosRequestConfig): AxiosRequestConfig {
        const newConfig = config || {};

        if (this.authToken) {
            newConfig.headers = {
                ...newConfig.headers,
                Authorization: `Bearer ${this.authToken}`,
            };
        }

        return newConfig;
    }
}

// Export singleton instance
export const apiClient = new ApiClient();
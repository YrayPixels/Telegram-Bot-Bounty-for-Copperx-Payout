import Pusher from 'pusher-js';
import { Bot } from 'grammy';
import { config } from '../config';
import { BotContext } from '../utils/session';
import { notificationApi } from '../api/notification';

// Map to store user chat IDs for notifications
const userChatIdMap = new Map<string, number>();

// Pusher event handlers
export interface DepositEvent {
    amount: string;
    currency: string;
    network: string;
    timestamp: string;
    transactionId: string;
}

// Pusher service class
export class PusherService {
    private pusher: Pusher | null = null;
    private bot: Bot<BotContext> | null = null;
    private channels: Record<string, Pusher.Channel> = {};

    constructor() {
        if (!config.pusher.appKey || !config.pusher.cluster) {
            config.logger.warn('Pusher configuration is incomplete. Notifications will not work.');
            return;
        }
    }

    // Initialize Pusher with bot instance
    public initialize(bot: Bot<BotContext>): void {
        this.bot = bot;

        this.pusher = new Pusher(config.pusher.appKey, {
            cluster: config.pusher.cluster,
            authorizer: (channel) => ({
                authorize: async (socketId, callback) => {
                    try {
                        const response = await notificationApi.authenticatePusher(socketId, channel.name);

                        if (response) {
                            callback(null, response);
                        } else {
                            callback(new Error('Pusher authentication failed'), { auth: '' });
                        }
                    } catch (error) {
                        config.logger.error('Pusher authorization error:', error);
                        callback(error as Error, { auth: '' });
                    }
                }
            })
        });

        config.logger.info('Pusher service initialized');
    }

    // Subscribe to organization's private channel
    public subscribeToOrganization(organizationId: string, chatId: number): void {
        if (!this.pusher || !this.bot) {
            config.logger.error('Pusher service not initialized');
            return;
        }

        const channelName = `private-org-${organizationId}`;

        // Store chat ID for this organization
        userChatIdMap.set(organizationId, chatId);

        // Check if already subscribed
        if (this.channels[channelName]) {
            config.logger.info(`Already subscribed to channel: ${channelName}`);
            return;
        }

        // Subscribe to the channel
        const channel = this.pusher.subscribe(channelName);

        // Handle subscription success
        channel.bind('pusher:subscription_succeeded', () => {
            config.logger.info(`Successfully subscribed to ${channelName}`);
        });

        // Handle subscription error
        channel.bind('pusher:subscription_error', (error: any) => {
            config.logger.error(`Subscription error for ${channelName}:`, error);
        });

        // Bind to deposit events
        channel.bind('deposit', (data: DepositEvent) => {
            this.handleDepositEvent(organizationId, data);
        });

        // Store the channel
        this.channels[channelName] = channel;
    }

    // Unsubscribe from organization's channel
    public unsubscribeFromOrganization(organizationId: string): void {
        if (!this.pusher) {
            return;
        }

        const channelName = `private-org-${organizationId}`;

        if (this.channels[channelName]) {
            this.pusher.unsubscribe(channelName);
            delete this.channels[channelName];
            userChatIdMap.delete(organizationId);
            config.logger.info(`Unsubscribed from channel: ${channelName}`);
        }
    }

    // Handle deposit event
    private handleDepositEvent(organizationId: string, data: DepositEvent): void {
        if (!this.bot) {
            return;
        }

        const chatId = userChatIdMap.get(organizationId);

        if (!chatId) {
            config.logger.warn(`No chat ID found for organization: ${organizationId}`);
            return;
        }

        // Format the message
        const message = `
💰 *New Deposit Received*

Amount: *${data.amount} ${data.currency}*
Network: *${data.network}*
Date: ${new Date(data.timestamp).toLocaleString()}
Transaction ID: \`${data.transactionId}\`
    `;

        // Send the notification
        this.bot.api.sendMessage(chatId, message, {
            parse_mode: 'Markdown'
        }).catch(error => {
            config.logger.error('Failed to send deposit notification:', error);
        });
    }

    // Disconnect Pusher
    public disconnect(): void {
        if (this.pusher) {
            this.pusher.disconnect();
            this.channels = {};
            userChatIdMap.clear();
            config.logger.info('Pusher service disconnected');
        }
    }
}

// Export singleton instance
export const pusherService = new PusherService();
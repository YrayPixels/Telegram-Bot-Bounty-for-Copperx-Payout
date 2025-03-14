import { Bot } from 'grammy';
import { BotContext } from '../../utils/session';
import { config } from '../../config';
import { pusherService } from '../../services/pusher.service';

pusherService
// Register notification handlers
export function registerNotificationHandlers(bot: Bot<BotContext>): void {
    // Initialize pusher service with bot instance
    pusherService.initialize(bot);

    // Handle reconnection on user login
    bot.on('message', async (ctx, next) => {
        // If user is authenticated but not subscribed to notifications
        if (ctx.session.authToken && ctx.session.organizationId) {
            try {
                // Subscribe to organization channel for notifications
                pusherService.subscribeToOrganization(
                    ctx.session.organizationId,
                    ctx.chat.id
                );
            } catch (error) {
                config.logger.error('Error subscribing to notifications:', error);
            }
        }

        // Continue to next middleware
        return next();
    });
}
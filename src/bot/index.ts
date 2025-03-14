import { Bot, session, GrammyError, HttpError, Context } from 'grammy';
import { config } from '../config';
import { registerCommands } from './command';
import { setupMiddleware } from './middleware';
import { UserSession, BotContext, SessionData } from '../utils/session';

// Create a new bot instance
export const bot = new Bot<BotContext>(config.bot.token);

// Initialize the bot
export async function initBot(): Promise<Bot<BotContext>> {
    // Set up session storage
    // @ts-expect-error
    bot.use(session({
        initial: () => ({
            authToken: undefined,
            organizationId: undefined,
            email: undefined,
            step: undefined,
            lastCommandTime: Date.now(),
            data: {},
        }),
    }));

    // Set up middleware
    setupMiddleware(bot);

    // Register commands
    registerCommands(bot);

    // Error handling
    bot.catch((err) => {
        const ctx = err.ctx;
        config.logger.error(`Error while handling update ${ctx.update.update_id}:`, err.error);

        if (err.error instanceof GrammyError) {
            config.logger.error('Error in request:', err.error.description);
        } else if (err.error instanceof HttpError) {
            config.logger.error('Could not contact Telegram:', err.error);
        } else {
            config.logger.error('Unknown error:', err.error);
        }

        // Notify user about the error
        ctx.reply('An error occurred while processing your request. Please try again later.')
            .catch((e) => config.logger.error('Failed to send error message:', e));
    });

    return bot;
}

// Initialize and return the bot
initBot().catch((err) => {
    config.logger.error('Failed to initialize bot:', err);
    process.exit(1);
});
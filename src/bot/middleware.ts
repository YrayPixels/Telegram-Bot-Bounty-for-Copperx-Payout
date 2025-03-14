import { Bot, NextFunction, Middleware } from 'grammy';
import { BotContext, isAuthenticated } from '../utils/session';
import { config } from '../config';

// Authentication middleware
const authMiddleware: Middleware<BotContext> = async (ctx, next) => {
    // Skip auth check for commands that don't require authentication
    const message = ctx.message?.text;
    if (message && (
        message.startsWith('/start') ||
        message.startsWith('/login') ||
        message.startsWith('/help')
    )) {
        return next();
    }

    // Check if user is authenticated
    if (!isAuthenticated(ctx)) {
        return ctx.reply(
            '🔒 You need to log in before using this feature.\n\n' +
            'Use /login to authenticate with your Copperx account.'
        );
    }

    return next();
}

// Session timeout middleware
const sessionTimeoutMiddleware: Middleware<BotContext> = async (ctx, next) => {
    if (isAuthenticated(ctx)) {
        const now = Date.now();
        const lastActive = ctx.session.lastCommandTime || 0;
        const timeout = 60 * 60 * 1000; // 1 hour timeout

        // Check if session has timed out
        if (now - lastActive > timeout) {
            ctx.session.authToken = undefined;
            return ctx.reply(
                '⏱️ Your session has expired for security reasons.\n\n' +
                'Please use /login to authenticate again.'
            );
        }

        // Update last command time
        ctx.session.lastCommandTime = now;
    }

    return next();
}

// Error handling middleware
const errorHandlingMiddleware: Middleware<BotContext> = async (ctx, next) => {
    return next().catch((error) => {
        config.logger.error('Error in request handler:', error);
        return ctx.reply(
            '❌ An error occurred while processing your request.\n\n' +
            'Please try again later or contact support: https://t.me/copperxcommunity/2183'
        );
    });
}

// Logging middleware
const loggingMiddleware: Middleware<BotContext> = async (ctx, next) => {
    const startTime = Date.now();
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    const messageText = ctx.message?.text;

    config.logger.info('Incoming request', {
        userId,
        username,
        messageText: messageText ? messageText.substring(0, 100) : undefined,
    });

    return next().then(() => {
        const responseTime = Date.now() - startTime;
        config.logger.info('Request completed', {
            userId,
            username,
            responseTime,
        });
    });
}

// Set up all middleware for the bot
export function setupMiddleware(bot: Bot<BotContext>) {
    bot.use(loggingMiddleware);
    bot.use(errorHandlingMiddleware);
    bot.use(sessionTimeoutMiddleware);
    bot.use(authMiddleware);
}
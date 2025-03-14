import { bot } from './bot'
import config from './config';

// Start the bot
async function startBot() {
    try {
        config.logger.info('Starting Copperx Payout Telegram Bot...');
        await bot.start();
    } catch (error) {
        config.logger.error('Failed to start bot:', error);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    config.logger.info('SIGINT received. Stopping bot...');
    await bot.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    config.logger.info('SIGTERM received. Stopping bot...');
    await bot.stop();
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    config.logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
    config.logger.error('Unhandled rejection:', reason);
});

// Start the bot
startBot();
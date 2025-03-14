import { Bot } from 'grammy';
import type { BotCommand } from 'grammy/types';
import { BotContext } from '../utils/session';
import { config } from '../config';
import { getMainMenuKeyboard } from './keyboards';
import { registerAuthHandlers } from './handlers/auth';
import { registerWalletHandlers } from './handlers/wallet';
import { registerTransferHandlers } from './handlers/transfer';
import { registerNotificationHandlers } from './handlers/notification';

// Define bot commands
const botCommands: BotCommand[] = [
    { command: 'start', description: 'Start the bot and get a welcome message' },
    { command: 'login', description: 'Login to your Copperx account' },
    { command: 'balance', description: 'Check your wallet balances' },
    { command: 'send', description: 'Send funds to email or wallet' },
    { command: 'withdraw', description: 'Withdraw funds to bank or external wallet' },
    { command: 'deposit', description: 'Get deposit information' },
    { command: 'transactions', description: 'View your recent transactions' },
    { command: 'settings', description: 'Manage your settings' },
    { command: 'help', description: 'Get help and support' },
    { command: 'logout', description: 'Logout from your account' },
];

// Register bot commands and handlers
export function registerCommands(bot: Bot<BotContext>): void {
    // Set bot commands in Telegram
    bot.api.setMyCommands(botCommands).catch(error => {
        config.logger.error('Failed to set bot commands:', error);
    });

    // Register command handlers

    // Start command
    bot.command('start', async (ctx) => {
        const userName = ctx.from?.first_name || 'there';

        await ctx.reply(
            `👋 Hello, ${userName}!\n\n` +
            `Welcome to the Copperx Payout Bot. This bot allows you to manage your Copperx account, view balances, send funds, and more directly from Telegram.\n\n` +
            `🔐 To get started, please use /login to authenticate with your Copperx account.\n\n` +
            `Need help? Use /help to see all available commands or contact support at https://t.me/copperxcommunity/2183`,
            {
                reply_markup: getMainMenuKeyboard(),
            }
        );
    });

    // Help command
    bot.command('help', async (ctx) => {
        await ctx.reply(
            `📌 *Copperx Payout Bot Help*\n\n` +
            `*Available Commands:*\n` +
            `/start - Start the bot and get a welcome message\n` +
            `/login - Login to your Copperx account\n` +
            `/balance - Check your wallet balances\n` +
            `/send - Send funds to email or wallet\n` +
            `/withdraw - Withdraw funds to bank or external wallet\n` +
            `/deposit - Get deposit information\n` +
            `/transactions - View your recent transactions\n` +
            `/settings - Manage your settings\n` +
            `/logout - Logout from your account\n\n` +
            `Need more help? Contact support at https://t.me/copperxcommunity/2183`,
            {
                parse_mode: 'Markdown',
                reply_markup: getMainMenuKeyboard(),
            }
        );
    });

    // Main menu callback
    bot.callbackQuery('main_menu', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(
            `🏠 *Main Menu*\n\n` +
            `Please select an option from the menu below:`,
            {
                parse_mode: 'Markdown',
                reply_markup: getMainMenuKeyboard(),
            }
        );
    });

    // Cancel callback
    bot.callbackQuery('cancel', async (ctx) => {
        await ctx.answerCallbackQuery('Operation cancelled');
        await ctx.editMessageText(
            `❌ Operation cancelled.\n\n` +
            `What would you like to do next?`,
            {
                reply_markup: getMainMenuKeyboard(),
            }
        );
    });

    // Register feature-specific handlers
    registerAuthHandlers(bot);
    registerWalletHandlers(bot);
    registerTransferHandlers(bot);
    registerNotificationHandlers(bot);
}
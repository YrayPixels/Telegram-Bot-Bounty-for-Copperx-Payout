import { Bot } from 'grammy';
import { BotContext, setStep, clearStep } from '../../utils/session';
import { walletApi, Wallet, WalletBalance } from '../../api/wallet';
import { authApi } from '../../api/auth';
import {
    getMainMenuKeyboard,
    getWalletBalanceKeyboard,
    getWalletsKeyboard,
    getBackToMenuKeyboard,
    getSettingsKeyboard
} from '../keyboards';
import { config } from '../../config';

// Helper function to format wallet balance display
function formatWalletBalances(balances: WalletBalance[]): string {
    if (balances.length === 0) {
        return 'You don\'t have any wallet balances yet.';
    }

    let result = '💰 *Your Wallet Balances*\n\n';

    for (const balance of balances) {
        result += `*${balance.network}* (${balance.currency})\n`;
        result += `• Available: ${balance.availableBalance} ${balance.currency}\n`;

        if (parseFloat(balance.pendingBalance) > 0) {
            result += `• Pending: ${balance.pendingBalance} ${balance.currency}\n`;
        }

        result += '\n';
    }

    return result;
}

// Helper function to format deposit information
function formatDepositInfo(wallet: Wallet): string {
    return `📥 *Deposit Information*\n\n` +
        `To deposit funds to your Copperx account, send ${wallet.currency} to the address below on the *${wallet.network}* network.\n\n` +
        `*${wallet.network} Address:*\n` +
        `\`${wallet.address}\`\n\n` +
        `⚠️ Make sure to send only ${wallet.currency} on the ${wallet.network} network to this address. Sending other tokens may result in loss of funds.`;
}

// Handle balance display
async function handleBalance(ctx: BotContext) {
    const message = ctx.callbackQuery
        ? await ctx.editMessageText('Fetching your balances...')
        : await ctx.reply('Fetching your balances...');

    try {
        const balances = await walletApi.getWalletBalances();

        const text = formatWalletBalances(balances);

        if (ctx.callbackQuery) {
            await ctx.editMessageText(text, {
                parse_mode: 'Markdown',
                reply_markup: getWalletBalanceKeyboard(balances),
            });
        } else {
            //@ts-ignore
            await ctx.api.deleteMessage(ctx.chat.id, message.message_id);
            await ctx.reply(text, {
                parse_mode: 'Markdown',
                reply_markup: getWalletBalanceKeyboard(balances),
            });
        }
    } catch (error) {
        config.logger.error('Error fetching wallet balances:', error);

        const errorMsg = '❌ *Error*\n\nFailed to fetch wallet balances. Please try again later.';

        if (ctx.callbackQuery) {
            await ctx.editMessageText(errorMsg, {
                parse_mode: 'Markdown',
                reply_markup: getBackToMenuKeyboard(),
            });
        } else {
            //@ts-ignore
            await ctx.api.deleteMessage(ctx.chat.id, message.message_id);
            await ctx.reply(errorMsg, {
                parse_mode: 'Markdown',
                reply_markup: getBackToMenuKeyboard(),
            });
        }
    }
}

// Handle deposit info
async function handleDeposit(ctx: BotContext) {
    const message = ctx.callbackQuery
        ? await ctx.editMessageText('Fetching deposit information...')
        : await ctx.reply('Fetching deposit information...');

    try {
        const defaultWallet = await walletApi.getDefaultWallet();

        const text = formatDepositInfo(defaultWallet);

        if (ctx.callbackQuery) {
            await ctx.editMessageText(text, {
                parse_mode: 'Markdown',
                reply_markup: getBackToMenuKeyboard(),
            });
        } else {
            //@ts-ignore

            await ctx.api.deleteMessage(ctx.chat.id, message.message_id);
            await ctx.reply(text, {
                parse_mode: 'Markdown',
                reply_markup: getBackToMenuKeyboard(),
            });
        }
    } catch (error) {
        config.logger.error('Error fetching deposit information:', error);

        const errorMsg = '❌ *Error*\n\nFailed to fetch deposit information. Please try again later.';

        if (ctx.callbackQuery) {
            await ctx.editMessageText(errorMsg, {
                parse_mode: 'Markdown',
                reply_markup: getBackToMenuKeyboard(),
            });
        } else {
            //@ts-ignore
            await ctx.api.deleteMessage(ctx.chat.id, message.message_id);
            await ctx.reply(errorMsg, {
                parse_mode: 'Markdown',
                reply_markup: getBackToMenuKeyboard(),
            });
        }
    }
}

// Handle settings
async function handleSettings(ctx: BotContext) {
    const text = '⚙️ *Settings*\n\nManage your account and wallet settings:';

    if (ctx.callbackQuery) {
        await ctx.editMessageText(text, {
            parse_mode: 'Markdown',
            reply_markup: getSettingsKeyboard(),
        });
    } else {
        await ctx.reply(text, {
            parse_mode: 'Markdown',
            reply_markup: getSettingsKeyboard(),
        });
    }
}

// Register wallet management handlers
export function registerWalletHandlers(bot: Bot<BotContext>): void {
    // Balance command
    bot.command('balance', async (ctx) => {
        await handleBalance(ctx);
    });

    // Balance callback
    bot.callbackQuery('balance', async (ctx) => {
        await ctx.answerCallbackQuery();
        await handleBalance(ctx);
    });

    // Deposit command
    bot.command('deposit', async (ctx) => {
        await handleDeposit(ctx);
    });

    // Deposit callback
    bot.callbackQuery('deposit', async (ctx) => {
        await ctx.answerCallbackQuery();
        await handleDeposit(ctx);
    });

    // Settings command
    bot.command('settings', async (ctx) => {
        await handleSettings(ctx);
    });

    // Settings callback
    bot.callbackQuery('settings', async (ctx) => {
        await ctx.answerCallbackQuery();
        await handleSettings(ctx);
    });

    // View profile callback
    bot.callbackQuery('view_profile', async (ctx) => {
        await ctx.answerCallbackQuery();

        try {
            const profile = await authApi.getUserProfile();

            await ctx.editMessageText(
                `👤 *User Profile*\n\n` +
                `*Name:* ${profile.firstName || ''} ${profile.lastName || ''}\n` +
                `*Email:* ${profile.email}\n` +
                `*Organization ID:* ${profile.organizationId}\n`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );
        } catch (error) {
            config.logger.error('Error fetching user profile:', error);

            await ctx.editMessageText(
                '❌ *Error*\n\n' +
                'Failed to fetch user profile. Please try again later.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );
        }
    });

    // Set default wallet callback
    bot.callbackQuery('set_default_wallet', async (ctx) => {
        await ctx.answerCallbackQuery();

        try {
            const wallets = await walletApi.getWallets();

            if (wallets.length === 0) {
                await ctx.editMessageText(
                    '❌ *No Wallets Available*\n\n' +
                    'You don\'t have any wallets available.',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getBackToMenuKeyboard(),
                    }
                );
                return;
            }

            await ctx.editMessageText(
                '🔄 *Set Default Wallet*\n\n' +
                'Select a wallet to set as your default:',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getWalletsKeyboard(wallets),
                }
            );

            setStep(ctx, 'select_default_wallet');
        } catch (error) {
            config.logger.error('Error fetching wallets:', error);

            await ctx.editMessageText(
                '❌ *Error*\n\n' +
                'Failed to fetch wallets. Please try again later.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );
        }
    });

    // Wallet selection callbacks
    bot.callbackQuery(/^wallet_(.+)$/, async (ctx) => {
        await ctx.answerCallbackQuery();

        if (ctx.session.step === 'select_default_wallet') {
            const walletId = ctx.match[1];

            try {
                await walletApi.setDefaultWallet(walletId);

                await ctx.editMessageText(
                    '✅ *Default Wallet Updated*\n\n' +
                    'Your default wallet has been updated successfully.',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getBackToMenuKeyboard(),
                    }
                );

                clearStep(ctx);
            } catch (error) {
                config.logger.error('Error setting default wallet:', error);

                await ctx.editMessageText(
                    '❌ *Error*\n\n' +
                    'Failed to set default wallet. Please try again later.',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getBackToMenuKeyboard(),
                    }
                );

                clearStep(ctx);
            }
        }
    });
}
import { Bot } from 'grammy';
import { BotContext, setStep, clearStep, getSessionData, setSessionData } from '../../utils/session';
import { transferApi, Transfer } from '../../api/transfer';
import { walletApi } from '../../api/wallet';
import {
    getMainMenuKeyboard,
    getCancelKeyboard,
    getConfirmKeyboard,
    getSendMoneyOptionsKeyboard,
    getWithdrawOptionsKeyboard,
    getTransactionHistoryKeyboard,
    getBackToMenuKeyboard
} from '../keyboards';
import { config } from '../../config';


// Format transaction history
function formatTransactions(transactions: Transfer[]): string {
    if (!transactions || transactions.length === 0) {
        return 'You don\'t have any transactions yet.';
    }

    let result = '📋 *Recent Transactions*\n\n';

    for (const tx of transactions) {
        const date = new Date(tx.createdAt).toLocaleString();
        let description = '';

        switch (tx.type) {
            case 'deposit':
                description = `📥 Deposit`;
                break;
            case 'withdrawal':
                description = `📤 Withdrawal`;
                break;
            case 'email_transfer':
                description = `📧 Email Transfer to ${tx.recipientEmail || 'user'}`;
                break;
            case 'wallet_transfer':
                description = `🔑 Wallet Transfer to ${tx.toAddress ? tx.toAddress.substring(0, 10) + '...' : 'address'}`;
                break;
            default:
                description = `💸 ${tx.type}`;
        }

        result += `*${description}*\n`;
        result += `• Amount: ${tx.amount} ${tx.currency}\n`;
        result += `• Status: ${tx.status}\n`;
        result += `• Date: ${date}\n\n`;
    }

    return result;
}

// Handle transaction history
async function handleTransactions(ctx: BotContext, page: number = 1) {
    const message = ctx.callbackQuery
        ? await ctx.editMessageText('Fetching your transactions...')
        : await ctx.reply('Fetching your transactions...');

    try {
        const limit = 5;
        const transactions = await transferApi.getTransferHistory(page, limit);

        // Assuming there might be more pages
        const hasMore = transactions.length === limit;

        const text = formatTransactions(transactions);

        if (ctx.callbackQuery) {
            await ctx.editMessageText(text, {
                parse_mode: 'Markdown',
                reply_markup: getTransactionHistoryKeyboard(page, hasMore ? page + 1 : page),
            });
        } else {
            //@ts-ignore
            await ctx.api.deleteMessage(ctx.chat.id, message.message_id);
            await ctx.reply(text, {
                parse_mode: 'Markdown',
                reply_markup: getTransactionHistoryKeyboard(page, hasMore ? page + 1 : page),
            });
        }
    } catch (error) {
        config.logger.error('Error fetching transactions:', error);

        const errorMsg = '❌ *Error*\n\nFailed to fetch transactions. Please try again later.';

        if (ctx.callbackQuery) {
            await ctx.editMessageText(errorMsg, {
                parse_mode: 'Markdown',
                reply_markup: getBackToMenuKeyboard(),
            });
        } else {
            //@ts-ignore
            await ctx.api.deleteMessage(ctx.chat?.id, message.message_id);
            await ctx.reply(errorMsg, {
                parse_mode: 'Markdown',
                reply_markup: getBackToMenuKeyboard(),
            });
        }
    }
}

// Register transfer handlers
export function registerTransferHandlers(bot: Bot<BotContext>): void {
    // Send command
    bot.command('send', async (ctx) => {
        await ctx.reply(
            '💸 *Send Money*\n\n' +
            'How would you like to send funds?',
            {
                parse_mode: 'Markdown',
                reply_markup: getSendMoneyOptionsKeyboard(),
            }
        );
    });

    // Send money callback
    bot.callbackQuery('send_money', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(
            '💸 *Send Money*\n\n' +
            'How would you like to send funds?',
            {
                parse_mode: 'Markdown',
                reply_markup: getSendMoneyOptionsKeyboard(),
            }
        );
    });

    // Send to email callback
    bot.callbackQuery('send_email', async (ctx) => {
        await ctx.answerCallbackQuery();

        try {
            // Get wallet balances
            const balances = await walletApi.getWalletBalances();

            if (!balances || balances.length === 0) {
                await ctx.editMessageText(
                    '❌ *No Funds Available*\n\n' +
                    'You don\'t have any funds available to send.',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getBackToMenuKeyboard(),
                    }
                );
                return;
            }

            // Format balance options
            let balanceText = '💰 *Available Balances*\n\n';

            if (Array.isArray(balances)) {

                for (const balance of balances) {
                    balanceText += `• Available: ${balance.walletId}\n`;

                    for (const item of balance.balances) {
                        balanceText += `• Available: ${item.balance} ${item.symbol}\n`;
                    }

                    balanceText += '\n';
                }

            } 

            await ctx.editMessageText(
                '📧 *Send to Email*\n\n' +
                balanceText + '\n' +
                'Please enter the recipient\'s email address:',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getCancelKeyboard(),
                }
            );

            setStep(ctx, 'send_email_address');
        } catch (error) {
            config.logger.error('Error fetching balances:', error);

            await ctx.editMessageText(
                '❌ *Error*\n\n' +
                'Failed to fetch your balances. Please try again later.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );
        }
    });

    // Send to wallet callback
    bot.callbackQuery('send_wallet', async (ctx) => {
        await ctx.answerCallbackQuery();

        try {
            // Get wallet balances
            const balances = await walletApi.getWalletBalances();

            if (!balances || balances.length === 0) {
                await ctx.editMessageText(
                    '❌ *No Funds Available*\n\n' +
                    'You don\'t have any funds available to send.',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getBackToMenuKeyboard(),
                    }
                );
                return;
            }

            // Format balance options
            let balanceText = '💰 *Available Balances*\n\n';
            if (Array.isArray(balances)) {

                for (const balance of balances) {
                    balanceText += `• Available: ${balance.walletId}\n`;

                    for (const item of balance.balances) {
                        balanceText += `• Available: ${item.balance} ${item.symbol}\n`;
                    }

                    balanceText += '\n';
                }

            } 

            await ctx.editMessageText(
                '🔑 *Send to Wallet*\n\n' +
                balanceText + '\n' +
                'Please enter the recipient\'s wallet address:',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getCancelKeyboard(),
                }
            );

            setStep(ctx, 'send_wallet_address');
        } catch (error) {
            config.logger.error('Error fetching balances:', error);

            await ctx.editMessageText(
                '❌ *Error*\n\n' +
                'Failed to fetch your balances. Please try again later.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );
        }
    });

    // Withdraw command
    bot.command('withdraw', async (ctx) => {
        await ctx.reply(
            '📤 *Withdraw Funds*\n\n' +
            'How would you like to withdraw your funds?',
            {
                parse_mode: 'Markdown',
                reply_markup: getWithdrawOptionsKeyboard(),
            }
        );
    });

    // Withdraw callback
    bot.callbackQuery('withdraw', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(
            '📤 *Withdraw Funds*\n\n' +
            'How would you like to withdraw your funds?',
            {
                parse_mode: 'Markdown',
                reply_markup: getWithdrawOptionsKeyboard(),
            }
        );
    });

    // Withdraw to bank callback
    bot.callbackQuery('withdraw_bank', async (ctx) => {
        await ctx.answerCallbackQuery();

        try {
            // Get wallet balances
            const balances = await walletApi.getWalletBalances();

            if (!balances || balances.length === 0) {
                await ctx.editMessageText(
                    '❌ *No Funds Available*\n\n' +
                    'You don\'t have any funds available to withdraw.',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getBackToMenuKeyboard(),
                    }
                );
                return;
            }

            // Format balance options
            let balanceText = '💰 *Available Balances*\n\n';

            if (Array.isArray(balances)) {

                for (const balance of balances) {
                    balanceText += `• Available: ${balance.walletId}\n`;

                    for (const item of balance.balances) {
                        balanceText += `• Available: ${item.balance} ${item.symbol}\n`;
                    }

                    balanceText += '\n';
                }

            } 

            await ctx.editMessageText(
                '🏦 *Withdraw to Bank Account*\n\n' +
                balanceText + '\n' +
                'Please enter the amount you wish to withdraw (e.g., 100):',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getCancelKeyboard(),
                }
            );

            setStep(ctx, 'withdraw_bank_amount');
        } catch (error) {
            config.logger.error('Error fetching balances:', error);

            await ctx.editMessageText(
                '❌ *Error*\n\n' +
                'Failed to fetch your balances. Please try again later.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );
        }
    });

    // Withdraw to wallet callback
    bot.callbackQuery('withdraw_wallet', async (ctx) => {
        await ctx.answerCallbackQuery();

        try {
            // Get wallet balances
            const balances = await walletApi.getWalletBalances();

            if (!balances || balances.length === 0) {
                await ctx.editMessageText(
                    '❌ *No Funds Available*\n\n' +
                    'You don\'t have any funds available to withdraw.',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getBackToMenuKeyboard(),
                    }
                );
                return;
            }

            // Format balance options
            let balanceText = '💰 *Available Balances*\n\n';

            if (Array.isArray(balances)) {

                for (const balance of balances) {
                    balanceText += `• Available: ${balance.walletId}\n`;

                    for (const item of balance.balances) {
                        balanceText += `• Available: ${item.balance} ${item.symbol}\n`;
                    }

                    balanceText += '\n';
                }

            } 

            await ctx.editMessageText(
                '🔑 *Withdraw to External Wallet*\n\n' +
                balanceText + '\n' +
                'Please enter the wallet address you wish to withdraw to:',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getCancelKeyboard(),
                }
            );

            setStep(ctx, 'withdraw_wallet_address');
        } catch (error) {
            config.logger.error('Error fetching balances:', error);

            await ctx.editMessageText(
                '❌ *Error*\n\n' +
                'Failed to fetch your balances. Please try again later.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );
        }
    });

    // Transactions command
    bot.command('transactions', async (ctx) => {
        await handleTransactions(ctx);
    });

    // Transactions callback
    bot.callbackQuery('transactions', async (ctx) => {
        await ctx.answerCallbackQuery();
        await handleTransactions(ctx);
    });

    // Handle transaction pagination
    bot.callbackQuery(/^tx_page_(\d+)$/, async (ctx) => {
        await ctx.answerCallbackQuery();
        const page = parseInt(ctx.match[1]);
        await handleTransactions(ctx, page);
    });

    // Confirm email transfer
    bot.callbackQuery('confirm_email_transfer', async (ctx) => {
        await ctx.answerCallbackQuery();

        const email = getSessionData<string>(ctx, 'recipient_email');
        const amount = getSessionData<string>(ctx, 'transfer_amount');

        if (!email || !amount) {
            await ctx.editMessageText(
                '❌ *Error*\n\n' +
                'Session error. Please restart the process.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );
            clearStep(ctx);
            return;
        }

        try {
            await ctx.editMessageText('⏳ Processing your transfer...');

            const result = await transferApi.sendToEmail({
                email,
                amount,
                currency: 'USDC',
                description: 'Sent via Telegram bot'
            });

            await ctx.editMessageText(
                '✅ *Transfer Successful*\n\n' +
                `You have successfully sent *${amount} USDC* to:\n` +
                `${email}\n\n` +
                `Transaction ID: \`${result.id}\`\n` +
                `Status: ${result.status}`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );

            clearStep(ctx);
        } catch (error) {
            config.logger.error('Email transfer error:', error);

            await ctx.editMessageText(
                '❌ *Transfer Failed*\n\n' +
                'We couldn\'t process your transfer. Please try again later or contact support.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );

            clearStep(ctx);
        }
    });

    // Confirm wallet transfer
    bot.callbackQuery('confirm_wallet_transfer', async (ctx) => {
        await ctx.answerCallbackQuery();

        const address = getSessionData<string>(ctx, 'recipient_address');
        const network = getSessionData<string>(ctx, 'recipient_network');
        const amount = getSessionData<string>(ctx, 'transfer_amount');

        if (!address || !network || !amount) {
            await ctx.editMessageText(
                '❌ *Error*\n\n' +
                'Session error. Please restart the process.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );
            clearStep(ctx);
            return;
        }

        try {
            await ctx.editMessageText('⏳ Processing your transfer...');

            const result = await transferApi.sendToWallet({
                toAddress: address,
                amount,
                currency: 'USDC',
                network,
                description: 'Sent via Telegram bot'
            });

            await ctx.editMessageText(
                '✅ *Transfer Successful*\n\n' +
                `You have successfully sent *${amount} USDC* to:\n` +
                `${address.substring(0, 15)}...${address.substring(address.length - 15)}\n` +
                `Network: ${network}\n\n` +
                `Transaction ID: \`${result.id}\`\n` +
                `Status: ${result.status}`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );

            clearStep(ctx);
        } catch (error) {
            config.logger.error('Wallet transfer error:', error);

            await ctx.editMessageText(
                '❌ *Transfer Failed*\n\n' +
                'We couldn\'t process your transfer. Please try again later or contact support.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );

            clearStep(ctx);
        }
    });

    // Confirm bank withdrawal
    bot.callbackQuery('confirm_bank_withdrawal', async (ctx) => {
        await ctx.answerCallbackQuery();

        const amount = getSessionData<string>(ctx, 'withdrawal_amount');

        if (!amount) {
            await ctx.editMessageText(
                '❌ *Error*\n\n' +
                'Session error. Please restart the process.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );
            clearStep(ctx);
            return;
        }

        try {
            await ctx.editMessageText('⏳ Processing your withdrawal...');

            const result = await transferApi.withdrawToBank({
                amount,
                currency: 'USDC',
                description: 'Withdrawn via Telegram bot'
            });

            await ctx.editMessageText(
                '✅ *Withdrawal Initiated*\n\n' +
                `You have initiated a withdrawal of *${amount} USDC* to your bank account.\n\n` +
                `Transaction ID: \`${result.id}\`\n` +
                `Status: ${result.status}\n\n` +
                `Note: Bank withdrawals typically take 1-3 business days to process.`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );

            clearStep(ctx);
        } catch (error) {
            config.logger.error('Bank withdrawal error:', error);

            await ctx.editMessageText(
                '❌ *Withdrawal Failed*\n\n' +
                'We couldn\'t process your withdrawal. This could be due to insufficient funds or minimum withdrawal requirements not being met.\n\n' +
                'Please try again later or contact support.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );

            clearStep(ctx);
        }
    });

    // Confirm wallet withdrawal
    bot.callbackQuery('confirm_wallet_withdrawal', async (ctx) => {
        await ctx.answerCallbackQuery();

        const address = getSessionData<string>(ctx, 'withdrawal_address');
        const network = getSessionData<string>(ctx, 'withdrawal_network');
        const amount = getSessionData<string>(ctx, 'withdrawal_amount');

        if (!address || !network || !amount) {
            await ctx.editMessageText(
                '❌ *Error*\n\n' +
                'Session error. Please restart the process.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );
            clearStep(ctx);
            return;
        }

        try {
            await ctx.editMessageText('⏳ Processing your withdrawal...');

            const result = await transferApi.sendToWallet({
                toAddress: address,
                amount,
                currency: 'USDC',
                network,
                description: 'Withdrawn via Telegram bot'
            });

            await ctx.editMessageText(
                '✅ *Withdrawal Successful*\n\n' +
                `You have successfully withdrawn *${amount} USDC* to:\n` +
                `${address.substring(0, 15)}...${address.substring(address.length - 15)}\n` +
                `Network: ${network}\n\n` +
                `Transaction ID: \`${result.id}\`\n` +
                `Status: ${result.status}`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );

            clearStep(ctx);
        } catch (error) {
            config.logger.error('Wallet withdrawal error:', error);

            await ctx.editMessageText(
                '❌ *Withdrawal Failed*\n\n' +
                'We couldn\'t process your withdrawal. Please try again later or contact support.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getBackToMenuKeyboard(),
                }
            );

            clearStep(ctx);
        }
    });

    // Handle email input for email transfer
    bot.hears(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, async (ctx) => {
        if (ctx.session.step !== 'send_email_address') {
            return;
        }
        //@ts-ignore

        const email = ctx.message.text;

        setSessionData(ctx, 'recipient_email', email);

        await ctx.reply(
            '💰 *Amount*\n\n' +
            `Recipient: ${email}\n\n` +
            'Please enter the amount you wish to send (e.g., 100):',
            {
                parse_mode: 'Markdown',
                reply_markup: getCancelKeyboard(),
            }
        );

        setStep(ctx, 'send_email_amount');
    });

    // Handle amount input for email transfer
    bot.hears(/^\d+(\.\d+)?$/, async (ctx) => {
        if (ctx.session.step === 'send_email_amount') {
            //@ts-ignore
            const amount = ctx.message.text;
            const email = getSessionData<string>(ctx, 'recipient_email');

            if (!email) {
                await ctx.reply(
                    '❌ *Error*\n\n' +
                    'Session error. Please restart the process.',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getMainMenuKeyboard(),
                    }
                );
                clearStep(ctx);
                return;
            }

            setSessionData(ctx, 'transfer_amount', amount);

            await ctx.reply(
                '✅ *Confirm Transfer*\n\n' +
                `You are about to send *${amount} USDC* to:\n` +
                `${email}\n\n` +
                'Is this correct?',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getConfirmKeyboard('confirm_email_transfer'),
                }
            );

            setStep(ctx, 'confirm_email_transfer');
        } else if (ctx.session.step === 'send_wallet_amount') {
            //@ts-ignore
            const amount = ctx.message.text;
            const address = getSessionData<string>(ctx, 'recipient_address');
            const network = getSessionData<string>(ctx, 'recipient_network');

            if (!address || !network) {
                await ctx.reply(
                    '❌ *Error*\n\n' +
                    'Session error. Please restart the process.',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getMainMenuKeyboard(),
                    }
                );
                clearStep(ctx);
                return;
            }

            setSessionData(ctx, 'transfer_amount', amount);

            await ctx.reply(
                '✅ *Confirm Transfer*\n\n' +
                `You are about to send *${amount} USDC* to:\n` +
                `${address.substring(0, 15)}...${address.substring(address.length - 15)}\n` +
                `Network: ${network}\n\n` +
                'Is this correct?',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getConfirmKeyboard('confirm_wallet_transfer'),
                }
            );

            setStep(ctx, 'confirm_wallet_transfer');
        } else if (ctx.session.step === 'withdraw_bank_amount') {
            //@ts-ignore
            const amount = ctx.message.text;

            setSessionData(ctx, 'withdrawal_amount', amount);

            await ctx.reply(
                '✅ *Confirm Bank Withdrawal*\n\n' +
                `You are about to withdraw *${amount} USDC* to your bank account.\n\n` +
                'Is this correct?',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getConfirmKeyboard('confirm_bank_withdrawal'),
                }
            );

            setStep(ctx, 'confirm_bank_withdrawal');
        } else if (ctx.session.step === 'withdraw_wallet_amount') {
            //@ts-ignore
            const amount = ctx.message.text;
            const address = getSessionData<string>(ctx, 'withdrawal_address');
            const network = getSessionData<string>(ctx, 'withdrawal_network');

            if (!address || !network) {
                await ctx.reply(
                    '❌ *Error*\n\n' +
                    'Session error. Please restart the process.',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getMainMenuKeyboard(),
                    }
                );
                clearStep(ctx);
                return;
            }

            setSessionData(ctx, 'withdrawal_amount', amount);

            await ctx.reply(
                '✅ *Confirm Wallet Withdrawal*\n\n' +
                `You are about to withdraw *${amount} USDC* to:\n` +
                `${address.substring(0, 15)}...${address.substring(address.length - 15)}\n` +
                `Network: ${network}\n\n` +
                'Is this correct?',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getConfirmKeyboard('confirm_wallet_withdrawal'),
                }
            );

            setStep(ctx, 'confirm_wallet_withdrawal');
        }
    });

    // Handle wallet address input for wallet transfer
    bot.on('message', async (ctx) => {
        if (!ctx.message.text) return;

        if (ctx.session.step === 'send_wallet_address') {
            const address = ctx.message.text.trim();

            setSessionData(ctx, 'recipient_address', address);

            await ctx.reply(
                '🌐 *Network Selection*\n\n' +
                'Please select the network for this transfer:\n\n' +
                '1. Solana\n' +
                '2. Ethereum\n\n' +
                'Reply with the number or name of the network:',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getCancelKeyboard(),
                }
            );

            setStep(ctx, 'send_wallet_network');
        } else if (ctx.session.step === 'send_wallet_network') {
            const input = ctx.message.text.trim().toLowerCase();
            let network = '';

            if (input === '1' || input === 'solana') {
                network = 'solana';
            } else if (input === '2' || input === 'ethereum') {
                network = 'ethereum';
            } else {
                await ctx.reply(
                    '❌ *Invalid Network*\n\n' +
                    'Please select a valid network:\n\n' +
                    '1. Solana\n' +
                    '2. Ethereum\n\n' +
                    'Reply with the number or name of the network:',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getCancelKeyboard(),
                    }
                );
                return;
            }

            setSessionData(ctx, 'recipient_network', network);

            await ctx.reply(
                '💰 *Amount*\n\n' +
                `Recipient address: ${getSessionData<string>(ctx, 'recipient_address')}\n` +
                `Network: ${network}\n\n` +
                'Please enter the amount you wish to send (e.g., 100):',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getCancelKeyboard(),
                }
            );

            setStep(ctx, 'send_wallet_amount');
        } else if (ctx.session.step === 'withdraw_wallet_address') {
            const address = ctx.message.text.trim();

            setSessionData(ctx, 'withdrawal_address', address);

            await ctx.reply(
                '🌐 *Network Selection*\n\n' +
                'Please select the network for this withdrawal:\n\n' +
                '1. Solana\n' +
                '2. Ethereum\n\n' +
                'Reply with the number or name of the network:',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getCancelKeyboard(),
                }
            );

            setStep(ctx, 'withdraw_wallet_network');
        } else if (ctx.session.step === 'withdraw_wallet_network') {
            const input = ctx.message.text.trim().toLowerCase();
            let network = '';

            if (input === '1' || input === 'solana') {
                network = 'solana';
            } else if (input === '2' || input === 'ethereum') {
                network = 'ethereum';
            } else {
                await ctx.reply(
                    '❌ *Invalid Network*\n\n' +
                    'Please select a valid network:\n\n' +
                    '1. Solana\n' +
                    '2. Ethereum\n\n' +
                    'Reply with the number or name of the network:',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getCancelKeyboard(),
                    }
                );
                return;
            }

            setSessionData(ctx, 'withdrawal_network', network);

            await ctx.reply(
                '💰 *Amount*\n\n' +
                `Withdrawal address: ${getSessionData<string>(ctx, 'withdrawal_address')}\n` +
                `Network: ${network}\n\n` +
                'Please enter the amount you wish to withdraw (e.g., 100):',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getCancelKeyboard(),
                }
            );

            setStep(ctx, 'withdraw_wallet_amount');
        }
    });
}
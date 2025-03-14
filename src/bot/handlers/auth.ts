import { Bot } from 'grammy';
import { BotContext, clearSession, setAuthData, setStep, clearStep } from '../../utils/session';
import { getCancelKeyboard, getMainMenuKeyboard } from '../keyboards';
import { pusherService } from '../../services/pusher.service';
import { config } from '../../config';
import { authApi } from '../../api/auth';
import { apiClient } from '../../api/client';


// Register authentication handlers
export function registerAuthHandlers(bot: Bot<BotContext>): void {
    // Login command
    bot.command('login', async (ctx) => {
        await ctx.reply(
            '🔐 *Login to Copperx*\n\n' +
            'Please enter the email address associated with your Copperx account:',
            {
                parse_mode: 'Markdown',
                reply_markup: getCancelKeyboard(),
            }
        );

        setStep(ctx, 'auth_email');
    });

    // Logout command
    bot.command('logout', async (ctx) => {
        if (ctx.session.organizationId) {
            pusherService.unsubscribeFromOrganization(ctx.session.organizationId);
        }

        clearSession(ctx);
        await authApi.logout();

        await ctx.reply(
            '👋 You have been successfully logged out.\n\n' +
            'Use /login to authenticate again.',
            {
                reply_markup: getMainMenuKeyboard(),
            }
        );
    });

    // Handle email input during login
    bot.hears(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, async (ctx) => {
        if (ctx.session.step !== 'auth_email') {
            return;
        }
//@ts-ignore
        const email = ctx.message.text || "";

        try {
            // Request OTP
            await authApi.requestEmailOtp(email);

            await ctx.reply(
                '📧 *Email OTP Sent*\n\n' +
                `We've sent a one-time password to ${email}.\n\n` +
                'Please enter the OTP you received:',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getCancelKeyboard(),
                }
            );

            setStep(ctx, 'auth_otp', { email });
        } catch (error) {
            config.logger.error('Error requesting OTP:', error);

            await ctx.reply(
                '❌ *Error Requesting OTP*\n\n' +
                'We couldn\'t send an OTP to this email. Please check if the email is correct and try again.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getCancelKeyboard(),
                }
            );
        }
    });

    // Handle OTP input during login
    bot.hears(/^\d{6}$/, async (ctx) => {
        if (ctx.session.step !== 'auth_otp') {
            return;
        }
//@ts-ignore
        const otp = ctx.message.text;
        const email = ctx.session.data.email;

        if (!email) {
            await ctx.reply(
                '❌ *Error*\n\n' +
                'Session error. Please restart the login process with /login.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getMainMenuKeyboard(),
                }
            );
            return;
        }

        try {
            // Authenticate with OTP
            const authResponse = await authApi.authenticateWithEmailOtp(email, otp || "");

            // Set auth data in session
            setAuthData(ctx, authResponse.token, authResponse.organizationId, email);

            // Set token in API client
            apiClient.setAuthToken(authResponse.token);

            // Get user profile
            const userProfile = await authApi.getUserProfile();

            // Subscribe to organization's notifications
            pusherService.subscribeToOrganization(
                authResponse.organizationId,
                ctx.chat.id
            );

            await ctx.reply(
                `✅ *Login Successful*\n\n` +
                `Welcome back, ${userProfile.firstName || 'User'}!\n\n` +
                `You're now logged in to your Copperx account.`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: getMainMenuKeyboard(),
                }
            );

            // Check KYC status
            try {
                const kycStatus = await authApi.getKycStatus();
                const latestKyc = kycStatus[0]; // Assuming the first one is the latest

                if (latestKyc && latestKyc.status !== 'approved') {
                    await ctx.reply(
                        `⚠️ *KYC Status: ${latestKyc.status}*\n\n` +
                        `Your KYC verification is not complete. Some features may be limited.\n\n` +
                        `Please complete your KYC verification on the Copperx platform.`,
                        {
                            parse_mode: 'Markdown',
                        }
                    );
                }
            } catch (error) {
                config.logger.error('Error checking KYC status:', error);
            }

            clearStep(ctx);
        } catch (error) {
            config.logger.error('Error authenticating with OTP:', error);

            await ctx.reply(
                '❌ *Authentication Failed*\n\n' +
                'The OTP you entered is invalid or has expired. Please try again.',
                {
                    parse_mode: 'Markdown',
                    reply_markup: getCancelKeyboard(),
                }
            );
        }
    });

    // Cancel login process
    bot.callbackQuery('cancel', async (ctx) => {
        if (ctx.session.step?.startsWith('auth_')) {
            clearStep(ctx);

            await ctx.answerCallbackQuery('Login cancelled');
            await ctx.editMessageText(
                '❌ Login process cancelled.\n\n' +
                'Use /login to try again.',
                {
                    reply_markup: getMainMenuKeyboard(),
                }
            );
        }
    });
}
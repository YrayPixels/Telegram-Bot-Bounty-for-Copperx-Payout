import { Bot } from 'grammy';
import { BotContext, clearSession, setAuthData, setStep, clearStep } from '../../utils/session';
import { authApi } from '../../api/auth';
import { apiClient } from '../../api/client';
import { getCancelKeyboard, getMainMenuKeyboard } from '../keyboards';
import { pusherService } from '../../services/pusher.service';
import { config } from '../../config';

// Register authentication handlers
export function registerAuthHandlers(bot: Bot<BotContext>): void {
    // Login command
    bot.command('login', async (ctx) => {
        config.logger.info('Login command received', { userId: ctx.from?.id });
        await ctx.reply(
            '🔐 *Login to Copperx*\n\n' +
            'Please enter the email address associated with your Copperx account:',
            {
                parse_mode: 'Markdown',
                reply_markup: getCancelKeyboard(),
            }
        );

        // Set step in session
        ctx.session.step = 'auth_email';
        config.logger.info('Set session step to auth_email', { userId: ctx.from?.id, step: ctx.session.step });
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

    // DEBUG command to check session state
    bot.command('debug', async (ctx) => {
        const sessionInfo = {
            step: ctx.session.step,
            authToken: ctx.session.authToken ? 'Set' : 'Not set',
            email: ctx.session.email,
            data: ctx.session.data
        };

        await ctx.reply(`Session debug info: ${JSON.stringify(sessionInfo, null, 2)}`);
    });

    // Process email input - explicit handler
    bot.on('message:text', async (ctx, next) => {
        const currentStep = ctx.session.step;
        const text = ctx.message.text;

        config.logger.info('Text message received', {
            userId: ctx.from?.id,
            text: text.substring(0, 10) + '...',
            currentStep
        });

        // Check if we're in the email input step
        if (currentStep === 'auth_email') {
            // Simple email validation regex
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

            if (!emailRegex.test(text)) {
                await ctx.reply(
                    '❌ *Invalid Email Format*\n\n' +
                    'Please enter a valid email address:',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getCancelKeyboard(),
                    }
                );
                return;
            }

            config.logger.info('Processing email input', { email: text });

            try {
            // Request OTP
                await ctx.reply('Requesting OTP, please wait...');
                await authApi.requestEmailOtp(text);

                // Store email in session data
                ctx.session.data = { ...ctx.session.data, email: text };

                await ctx.reply(
                    '📧 *Email OTP Sent*\n\n' +
                    `We've sent a one-time password to ${text}.\n\n` +
                    'Please enter the OTP you received:',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getCancelKeyboard(),
                    }
                );

                // Update session step
                ctx.session.step = 'auth_otp';
                config.logger.info('Updated session step to auth_otp', { step: ctx.session.step });
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

            return;
        }

        // Check if we're in the OTP input step
        if (currentStep === 'auth_otp') {
            // Simple OTP validation - 6 digits
            const otpRegex = /^\d{6}$/;

            if (!otpRegex.test(text)) {
                await ctx.reply(
                    '❌ *Invalid OTP Format*\n\n' +
                    'Please enter a valid 6-digit OTP:',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getCancelKeyboard(),
                    }
                );
                return;
            }

            const email = ctx.session.data?.email;

            if (!email) {
                await ctx.reply(
                    '❌ *Error*\n\n' +
                    'Session error. Please restart the login process with /login.',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: getMainMenuKeyboard(),
                    }
                );
                ctx.session.step = undefined;
                return;
            }

            config.logger.info('Processing OTP input', { email });

            try {
            // Authenticate with OTP
                await ctx.reply('Verifying OTP, please wait...');
                const authResponse = await authApi.authenticateWithEmailOtp(email, text);

                // Set auth data in session
                ctx.session.authToken = authResponse.accessToken;
                ctx.session.organizationId = authResponse.user.organizationId;
                ctx.session.email = email;
                ctx.session.lastCommandTime = Date.now();

                // Set token in API client
                apiClient.setAuthToken(authResponse.accessToken);

                // Get user profile
                const userProfile = await authApi.getUserProfile();

                // Subscribe to organization's notifications
                pusherService.subscribeToOrganization(
                    authResponse.user.organizationId,
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

                // Clear session step
                ctx.session.step = undefined;
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

            return;
        }

        // If we're not in any auth step, proceed to next middleware
        return next();
    });

    // Cancel login process
    bot.callbackQuery('cancel', async (ctx) => {
        const currentStep = ctx.session.step;

        if (currentStep?.startsWith('auth_')) {
            ctx.session.step = undefined;

            await ctx.answerCallbackQuery('Login cancelled');
            await ctx.editMessageText(
                '❌ Login process cancelled.\n\n' +
                'Use /login to try again.',
                {
                    reply_markup: getMainMenuKeyboard(),
                }
            );
        } else {
            await ctx.answerCallbackQuery('Operation cancelled');
        }
    });
}
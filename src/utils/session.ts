import { Context, SessionFlavor } from 'grammy';

// User session state
export interface SessionData {
    authToken?: string;       // User's authentication token
    organizationId?: string;  // User's organization ID
    email?: string;          // User's email
    step?: string;           // Current step in a multi-step process
    lastCommandTime: number; // Timestamp of the last command
    data: Record<string, any>; // Additional data
}

// Session flavor for the bot context
export type UserSession = SessionFlavor<SessionData>;

// Extended context with session
export type BotContext = Context & UserSession;

/**
 * Check if the user is authenticated
 * @param ctx Bot context
 * @returns Boolean indicating if the user is authenticated
 */
export function isAuthenticated(ctx: BotContext): boolean {
    return !!ctx.session.authToken;
}

/**
 * Clear user session data
 * @param ctx Bot context
 */
export function clearSession(ctx: BotContext): void {
    ctx.session.authToken = undefined;
    ctx.session.organizationId = undefined;
    ctx.session.email = undefined;
    ctx.session.step = undefined;
    ctx.session.data = {};
}

/**
 * Set authentication data in session
 * @param ctx Bot context
 * @param token Authentication token
 * @param organizationId Organization ID
 * @param email User email
 */
export function setAuthData(
    ctx: BotContext,
    token: string,
    organizationId: string,
    email: string
): void {
    ctx.session.authToken = token;
    ctx.session.organizationId = organizationId;
    ctx.session.email = email;
    ctx.session.lastCommandTime = Date.now();
}

/**
 * Set current step in a multi-step process
 * @param ctx Bot context
 * @param step Step identifier
 * @param data Optional data to store
 */
export function setStep(
    ctx: BotContext,
    step: string,
    data?: Record<string, any>
): void {
    ctx.session.step = step;
    if (data) {
        ctx.session.data = { ...ctx.session.data, ...data };
    }
}

/**
 * Clear current step
 * @param ctx Bot context
 */
export function clearStep(ctx: BotContext): void {
    ctx.session.step = undefined;
}

/**
 * Get data from the session
 * @param ctx Bot context
 * @param key Data key
 * @returns Data value or undefined
 */
export function getSessionData<T>(
    ctx: BotContext,
    key: string
): T | undefined {
    return ctx.session.data[key] as T | undefined;
}

/**
 * Set data in the session
 * @param ctx Bot context
 * @param key Data key
 * @param value Data value
 */
export function setSessionData<T>(
    ctx: BotContext,
    key: string,
    value: T
): void {
    ctx.session.data[key] = value;
}
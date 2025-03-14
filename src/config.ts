import dotenv from 'dotenv';
import { Logger } from 'winston';
import * as winston from 'winston';

// Load environment variables
dotenv.config();

// Essential environment variables
const requiredEnvVars = ['BOT_TOKEN', 'API_BASE_URL'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

// Configure logger
const logger: Logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
    ],
});

// Export configuration
export const config = {
    bot: {
        token: process.env.BOT_TOKEN as string,
    },
    api: {
        baseUrl: process.env.API_BASE_URL as string,
    },
    pusher: {
        appKey: process.env.PUSHER_APP_KEY || '',
        cluster: process.env.PUSHER_CLUSTER || '',
    },
    logger,
};

export default config;
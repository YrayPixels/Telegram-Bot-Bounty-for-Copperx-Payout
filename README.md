# Copperx Payout Telegram Bot

This Telegram bot integrates with Copperx Payout API, allowing users to manage their Copperx account, view balances, and perform transfers directly through Telegram.

## Features

### 🔐 Authentication & Account Management
- Login with Copperx email and OTP
- View account profile
- Check KYC/KYB approval status

### 👛 Wallet Management
- View all wallet balances across networks
- Set default wallet
- View deposit addresses
- View transaction history

### 💸 Fund Transfers
- Send funds to email addresses
- Send funds to external wallet addresses
- Withdraw funds to bank accounts
- View recent transactions

### 🔔 Real-time Deposit Notifications
- Receive notifications when funds are deposited to your account

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Telegram Bot Token (Get one from @BotFather on Telegram)
- Copperx API credentials

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/copperx-telegram-bot.git
cd copperx-telegram-bot
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Configure environment variables
Create a `.env` file in the root directory with the following variables:
```
BOT_TOKEN=your_telegram_bot_token_here
API_BASE_URL=https://income-api.copperx.io/api
PUSHER_APP_KEY=your_pusher_app_key
PUSHER_CLUSTER=your_pusher_cluster
LOG_LEVEL=info
```

4. Build the project
```bash
npm run build
# or
yarn build
```

5. Start the bot
```bash
npm start
# or
yarn start
```

### Deployment

You can deploy this bot on platforms like Render or Heroku:

#### Deploying to Render
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the build and start commands:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add the environment variables from your `.env` file
5. Deploy the service

## Command Reference

- `/start` - Start the bot and get a welcome message
- `/login` - Login to your Copperx account
- `/balance` - Check your wallet balances
- `/send` - Send funds to email or wallet
- `/withdraw` - Withdraw funds to bank or external wallet
- `/deposit` - Get deposit information
- `/transactions` - View your recent transactions
- `/settings` - Manage your settings
- `/help` - Get help and support
- `/logout` - Logout from your account

## Technical Details

### Project Structure
```
├── src/
│   ├── index.ts//done                // Entry point
│   ├── config.ts//done              // Configuration and environment variables
│   ├── bot
│   │   ├── index.ts             // Bot initialization
│   │   ├── commands.ts          // Command definitions
│   │   ├── middleware.ts        // Bot middleware (auth checks, etc.)
│   │   ├── keyboards.ts         // Inline keyboard builders
│   │   └── handlers/           
│   │       ├── auth.ts          // Authentication handlers
│   │       ├── wallet.ts        // Wallet management handlers
│   │       ├── transfer.ts      // Fund transfer handlers
│   │       └── notifications.ts  // Notification handlers
│   ├── api//done
│   │   ├── client.ts            // API client setup
│   │   ├── auth.ts              // Authentication API methods
│   │   ├── wallet.ts            // Wallet API methods
│   │   ├── transfer.ts          // Transfer API methods
│   │   └── notifications.ts     // Notification API methods
│   ├── services/
│   │   ├── auth.service.ts      // Authentication business logic
│   │   ├── wallet.service.ts    // Wallet business logic
│   │   ├── transfer.service.ts  // Transfer business logic
│   │   └── pusher.service.ts    // Pusher client for real-time notifications
│   └── utils/
│       ├── session.ts           // Session management
│       ├── validation.ts        // Input validation
│       └── formatting.ts        // Message formatting
```

### Technology Stack
- TypeScript - For type safety and better code organization
- Grammy - Modern Telegram Bot framework for Node.js
- Axios - For HTTP requests to Copperx API
- Pusher - For real-time notifications
- Winston - For logging

## Security Considerations

- The bot implements proper authentication flows with OTPs
- No plaintext passwords are stored
- Secure session management with timeouts
- All sensitive data is handled securely

## Troubleshooting

### Common Issues

#### Bot is not responding
- Check if the bot is running
- Verify that your Telegram bot token is correct
- Ensure your internet connection is stable

#### API Connection Issues
- Verify that the API base URL is correct
- Check if your Copperx API is accessible
- Verify that you have proper network connectivity

#### Authentication Problems
- Ensure you're using the correct email
- Check if the OTP is entered correctly
- Verify that your account has proper permissions

## Support

For support, contact Copperx community at https://t.me/copperxcommunity/2183
import { InlineKeyboard } from 'grammy';
import { Wallet, WalletBalance } from '../api/wallet';

// Main menu keyboard
export function getMainMenuKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text('💰 Balance', 'balance')
        .text('💸 Send Money', 'send_money')
        .row()
        .text('📤 Withdraw', 'withdraw')
        .text('📥 Deposit', 'deposit')
        .row()
        .text('📋 Transaction History', 'transactions')
        .row()
        .text('⚙️ Settings', 'settings')
        .text('ℹ️ Help', 'help');
}

// Cancel keyboard
export function getCancelKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text('❌ Cancel', 'cancel');
}

// Back to menu keyboard
export function getBackToMenuKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text('🔙 Back to Menu', 'main_menu');
}

// Confirm action keyboard
export function getConfirmKeyboard(confirmAction: string): InlineKeyboard {
    return new InlineKeyboard()
        .text('✅ Confirm', confirmAction)
        .text('❌ Cancel', 'cancel');
}

// Send money options keyboard
export function getSendMoneyOptionsKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text('📧 Send to Email', 'send_email')
        .row()
        .text('🔑 Send to Wallet', 'send_wallet')
        .row()
        .text('🔙 Back to Menu', 'main_menu');
}

// Withdraw options keyboard
export function getWithdrawOptionsKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text('🏦 To Bank Account', 'withdraw_bank')
        .row()
        .text('🔑 To External Wallet', 'withdraw_wallet')
        .row()
        .text('🔙 Back to Menu', 'main_menu');
}

// Settings keyboard
export function getSettingsKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text('🔄 Set Default Wallet', 'set_default_wallet')
        .row()
        .text('👤 View Profile', 'view_profile')
        .row()
        .text('🔙 Back to Menu', 'main_menu');
}

// Wallets selection keyboard
export function getWalletsKeyboard(wallets: Wallet[]): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    wallets.forEach((wallet, i) => {
        keyboard.text(
            `${wallet.isDefault ? '✅ ' : ''}${wallet.network}: ${wallet.address.substring(0, 10)}...`,
            `wallet_${wallet.id}`
        );

        if (i < wallets.length - 1) {
            keyboard.row();
        }
    });

    keyboard.row().text('🔙 Back', 'main_menu');

    return keyboard;
}

// Transaction history navigation keyboard
export function getTransactionHistoryKeyboard(
    currentPage: number,
    totalPages: number
): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    if (currentPage > 1) {
        keyboard.text('⬅️ Previous', `tx_page_${currentPage - 1}`);
    }

    if (currentPage < totalPages) {
        keyboard.text('➡️ Next', `tx_page_${currentPage + 1}`);
    }

    keyboard.row().text('🔙 Back to Menu', 'main_menu');

    return keyboard;
}

// Get wallet balance display keyboard
export function getWalletBalanceKeyboard(balances: WalletBalance[]): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    if (balances.length > 0) {
        keyboard.text('📥 Deposit', 'deposit');
        keyboard.text('📤 Withdraw', 'withdraw');
        keyboard.row();
    }

    keyboard.text('🔙 Back to Menu', 'main_menu');

    return keyboard;
}
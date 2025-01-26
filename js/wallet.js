// Wallet configuration
const WALLET_CONFIG = {
    coinbase: {
        name: 'Coinbase Wallet',
        mobile: {
            android: 'https://play.google.com/store/apps/details?id=org.toshi',
            ios: 'https://apps.apple.com/us/app/coinbase-wallet/id1278383455',
            scheme: 'cbwallet://'
        },
        desktop: {
            downloadUrl: 'https://www.coinbase.com/wallet/downloads'
        }
    },
    trust: {
        name: 'Trust Wallet',
        mobile: {
            android: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
            ios: 'https://apps.apple.com/us/app/trust-crypto-bitcoin-wallet/id1288339409',
            scheme: 'trust://'
        }
    },
    binance: {
        name: 'Binance Wallet',
        mobile: {
            android: 'https://play.google.com/store/apps/details?id=com.binance.dev',
            ios: 'https://apps.apple.com/us/app/binance-buy-bitcoin-crypto/id1436799971',
            scheme: 'bnb://'
        }
    },
    exodus: {
        name: 'Exodus Wallet',
        mobile: {
            android: 'https://play.google.com/store/apps/details?id=exodusmovement.exodus',
            ios: 'https://apps.apple.com/us/app/exodus-crypto-bitcoin-wallet/id1414384820',
            scheme: 'exodus://'
        },
        desktop: {
            downloadUrl: 'https://www.exodus.com/download'
        }
    },
    atomic: {
        name: 'Atomic Wallet',
        mobile: {
            android: 'https://play.google.com/store/apps/details?id=io.atomicwallet',
            ios: 'https://apps.apple.com/us/app/atomic-wallet-bitcoin-crypto/id1478257827',
            scheme: 'atomicwallet://'
        },
        desktop: {
            downloadUrl: 'https://atomicwallet.io/downloads'
        }
    },
    ledger: {
        name: 'Ledger Live',
        desktop: {
            downloadUrl: 'https://www.ledger.com/ledger-live/download'
        }
    },
    mydoge: {
        name: 'MyDoge Wallet',
        mobile: {
            android: 'https://play.google.com/store/apps/details?id=com.mydoge.wallet',
            ios: 'https://apps.apple.com/us/app/mydoge-wallet/id1602049783',
            scheme: 'mydoge://'
        }
    }
};

// Detect if user is on mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Get wallet configuration
function getWalletConfig(walletType) {
    return WALLET_CONFIG[walletType];
}

// Generate deep link for wallet connection
function generateWalletDeepLink(walletType, amount, address) {
    const config = WALLET_CONFIG[walletType];
    if (!config) return null;

    // Format amount to 8 decimal places max (Dogecoin standard)
    const formattedAmount = parseFloat(amount).toFixed(8);
    
    // Base deep link structure for Dogecoin
    const deepLink = `${config.mobile.scheme}doge/pay?address=${address}&amount=${formattedAmount}`;
    
    return deepLink;
}

// Handle wallet connection
async function connectWallet(walletType) {
    const config = getWalletConfig(walletType);
    if (!config) {
        throw new Error('Unsupported wallet type');
    }

    // Check if on mobile
    const isMobile = isMobileDevice();

    if (isMobile) {
        // For mobile, we'll return the wallet's deep link scheme
        return {
            type: 'mobile',
            scheme: config.mobile.scheme,
            storeLinks: {
                android: config.mobile.android,
                ios: config.mobile.ios
            }
        };
    } else {
        // For desktop, we need to check if the wallet extension is installed
        if (walletType === 'ledger') {
            // Special handling for Ledger Live
            return {
                type: 'desktop',
                downloadUrl: config.desktop.downloadUrl
            };
        }

        // For other desktop wallets, check if extension is available
        const walletExtension = await checkWalletExtension(walletType);
        if (!walletExtension) {
            return {
                type: 'desktop',
                downloadUrl: config.desktop.downloadUrl
            };
        }

        return {
            type: 'desktop',
            extension: walletExtension
        };
    }
}

// Check if wallet extension is installed (desktop only)
async function checkWalletExtension(walletType) {
    switch (walletType) {
        case 'coinbase':
            return window.coinbaseWallet || null;
        case 'exodus':
            return window.exodus || null;
        case 'atomic':
            return window.atomicWallet || null;
        default:
            return null;
    }
}

// Initialize transaction
async function initializeTransaction(walletType, amount, recipientAddress) {
    try {
        const connection = await connectWallet(walletType);
        
        if (connection.type === 'mobile') {
            // Generate deep link for mobile wallets
            const deepLink = generateWalletDeepLink(walletType, amount, recipientAddress);
            return {
                success: true,
                type: 'mobile',
                deepLink,
                storeLinks: connection.storeLinks
            };
        } else {
            // Handle desktop wallet connection
            if (!connection.extension) {
                return {
                    success: false,
                    type: 'desktop',
                    error: 'Wallet extension not installed',
                    downloadUrl: connection.downloadUrl
                };
            }

            // Request transaction through wallet extension
            return {
                success: true,
                type: 'desktop',
                extension: connection.extension
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

export {
    connectWallet,
    initializeTransaction,
    isMobileDevice,
    getWalletConfig
};

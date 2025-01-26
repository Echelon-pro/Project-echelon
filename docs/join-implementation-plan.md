# Join Page Implementation Plan

## 1. Wallet Integration

### A. Wallet Connection Implementation
```javascript
// Add to join.html
const walletConnectors = {
    coinbase: new CoinbaseConnector(),
    metamask: new MetaMaskConnector(),
    trust: new TrustWalletConnector(),
    binance: new BinanceConnector(),
    phantom: new PhantomConnector()
};

async function connectWallet(type) {
    try {
        const connector = walletConnectors[type];
        const connection = await connector.connect();
        updateWalletStatus(connection);
    } catch (error) {
        handleWalletError(error);
    }
}
```

### B. Connection Status Indicators
```html
<div class="wallet-status">
    <div class="status-indicator"></div>
    <span class="status-text">Not Connected</span>
    <button class="disconnect-wallet" style="display: none;">Disconnect</button>
</div>
```

### C. Transaction Preview Modal
```html
<div id="transactionPreview" class="modal">
    <div class="modal-content">
        <h3>Transaction Preview</h3>
        <div class="preview-details">
            <p>Amount: <span id="previewAmount">0</span> DOGE</p>
            <p>Network: Dogecoin</p>
            <p>Recipient: DFQ1SkPz8LiTNkLs3M4uLGdNsQ33Vrpfng</p>
            <p>Estimated Time: <span id="estimatedTime">2-5 minutes</span></p>
            <p>Network Fee: <span id="networkFee">~0.001 DOGE</span></p>
        </div>
        <div class="preview-actions">
            <button id="confirmTransaction">Confirm</button>
            <button id="cancelTransaction">Cancel</button>
        </div>
    </div>
</div>
```

## 2. Transaction Flow

### A. Validation Rules
```javascript
const MINIMUM_DOGE = 69;
const RECIPIENT_ADDRESS = 'DFQ1SkPz8LiTNkLs3M4uLGdNsQ33Vrpfng';

function validateTransaction(amount) {
    if (amount < MINIMUM_DOGE) {
        throw new Error(`Minimum contribution is ${MINIMUM_DOGE} DOGE`);
    }
    // Add more validation as needed
}
```

### B. Transaction Status Updates
```javascript
const TransactionStates = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed'
};

function updateTransactionStatus(status, hash) {
    const statusElement = document.getElementById('transactionStatus');
    const messageElement = document.getElementById('statusMessage');
    
    switch(status) {
        case TransactionStates.PENDING:
            messageElement.innerHTML = `
                <i class="fas fa-hourglass-half"></i>
                Transaction Pending<br>
                Estimated confirmation time: 2-5 minutes<br>
                <small>Transaction Hash: ${hash}</small>
            `;
            break;
        // Add more cases
    }
}
```

## 3. Error Handling

### A. Network Error Handler
```javascript
function handleNetworkError(error) {
    const errorTypes = {
        NETWORK_OFFLINE: 'Check your internet connection',
        PRICE_UPDATE_FAILED: 'Using last known price',
        WALLET_DISCONNECTED: 'Wallet disconnected unexpectedly'
    };

    showError(errorTypes[error.type] || 'An unexpected error occurred');
}
```

### B. Price Update Fallback
```javascript
class PriceService {
    constructor() {
        this.lastKnownPrice = null;
        this.lastUpdateTime = null;
    }

    async getPrice() {
        try {
            const price = await fetchCurrentPrice();
            this.updateCache(price);
            return price;
        } catch (error) {
            return this.getFallbackPrice();
        }
    }

    getFallbackPrice() {
        if (!this.lastKnownPrice) {
            throw new Error('No price data available');
        }
        // Show warning about using cached price
        return this.lastKnownPrice;
    }
}
```

## 4. Technical Implementation Details

### A. Loading States
```css
.loading-state {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
}

.loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--accent-color);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
```

### B. Transaction History Update
```javascript
async function updateTransactionHistory(newTransaction) {
    const history = await fetchTransactionHistory();
    history.unshift(newTransaction);
    
    // Update UI
    const historyElement = document.querySelector('.transaction-history');
    if (historyElement) {
        renderTransactionHistory(history);
    }
}
```

## Implementation Steps

1. **Phase 1: Wallet Integration**
   - Implement wallet connectors
   - Add status indicators
   - Add validation logic

2. **Phase 2: Transaction Flow**
   - Create transaction preview modal
   - Implement confirmation flow
   - Add transaction status updates

3. **Phase 3: Error Handling**
   - Implement network error handlers
   - Add price update fallback
   - Add transaction error recovery

4. **Phase 4: Polish**
   - Add loading states
   - Implement history updates
   - Add final UI touches

## Notes
- All wallet implementations should use Dogecoin network
- Minimum contribution: 69 DOGE
- Recipient address: D8RCEvQKymzkvQAZ9FPas35N6AWBQUuc7i
- Estimated transaction time: 2-5 minutes
- Show network fees before transaction
- Include cancel options at appropriate steps

# PrivateRPC MetaMask Snap

This MetaMask Snap provides enhanced privacy features for Ethereum transactions and enables atomic ETH ↔ XMR swaps through the PrivateRPC service.

## Features

- **Enhanced Privacy**: Automatic transaction interception and privacy enhancement
- **Stealth Addresses**: Generate one-time stealth addresses for transactions
- **Meta-Transactions**: Create and sign EIP-712 meta-transactions for gas-less operations
- **Atomic Swaps**: Seamless ETH ↔ XMR atomic swaps
- **Monero Key Management**: Secure one-time Monero key management via Lit Protocol

## Installation

### For Users

1. Install [MetaMask Flask](https://metamask.io/flask/)
2. Visit the PrivateRPC website (coming soon)
3. Click "Connect" and approve the snap installation

### For Developers

```bash
# Clone the repository
git clone https://github.com/madschristensen99/PrivateRPC.git

# Navigate to the snap directory
cd PrivateRPC/snap-private-rpc

# Install dependencies
npm install

# Build the snap
npm run build

# Serve the snap locally
npm run serve
```

## Usage

### Connect to the Snap

```javascript
// Connect to the snap
const snapId = 'npm:private-rpc-snap';
await ethereum.request({
  method: 'wallet_enable',
  params: [{
    wallet_snap: { [snapId]: {} },
  }]
});
```

### Get Snap Info

```javascript
// Get snap info
const info = await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId,
    request: {
      method: 'prpc_getInfo',
    },
  },
});
```

### Create an Atomic Swap

```javascript
// Create an ETH → XMR swap
const result = await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId,
    request: {
      method: 'prpc_createSwap',
      params: {
        amount: '0.1',
        direction: 'ETH→XMR',
        refundAddr: '0xYourRefundAddress',
      },
    },
  },
});
```

### Get Swap Status

```javascript
// Get swap status
const status = await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId,
    request: {
      method: 'prpc_getSwapStatus',
      params: {
        swapId: 'your-swap-id',
      },
    },
  },
});
```

### List Swaps

```javascript
// List all swaps
const swaps = await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId,
    request: {
      method: 'prpc_listSwaps',
    },
  },
});
```

### Cancel a Swap

```javascript
// Cancel a swap
const result = await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId,
    request: {
      method: 'prpc_cancelSwap',
      params: {
        swapId: 'your-swap-id',
      },
    },
  },
});
```

### Get Exchange Rate

```javascript
// Get current ETH-XMR exchange rate
const rate = await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId,
    request: {
      method: 'prpc_getExchangeRate',
    },
  },
});
```

## API Reference

### `prpc_getInfo`

Returns information about the snap.

**Parameters**: None

**Returns**:
```json
{
  "name": "PrivateRPC Snap",
  "version": "0.1.0",
  "ethereumAddress": "0x..."
}
```

### `prpc_createSwap`

Creates a new atomic swap.

**Parameters**:
```json
{
  "amount": "0.1",
  "direction": "ETH→XMR",
  "refundAddr": "0x..."
}
```

**Returns**:
```json
{
  "success": true,
  "swapId": "swap-id",
  "details": {
    // Swap details
  }
}
```

### `prpc_getSwapStatus`

Gets the status of an existing swap.

**Parameters**:
```json
{
  "swapId": "swap-id"
}
```

**Returns**:
```json
{
  "success": true,
  "status": "pending",
  "details": {
    // Swap details
  }
}
```

### `prpc_listSwaps`

Lists all swaps for the current user.

**Parameters**: None

**Returns**:
```json
{
  "success": true,
  "swaps": [
    {
      "swapId": "swap-id",
      "status": "pending",
      "details": {
        // Swap details
      }
    }
  ]
}
```

### `prpc_cancelSwap`

Cancels an existing swap.

**Parameters**:
```json
{
  "swapId": "swap-id"
}
```

**Returns**:
```json
{
  "success": true,
  "message": "Swap cancelled successfully"
}
```

### `prpc_getExchangeRate`

Gets the current ETH-XMR exchange rate.

**Parameters**: None

**Returns**:
```json
{
  "success": true,
  "rate": "0.1",
  "timestamp": 1625097600
}
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## License

MIT

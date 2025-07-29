# 🔄 PrivateRPC Compatibility Roadmap

This document outlines the plan to make PrivateRPC fully compatible with existing wallets and dApps while preserving its privacy and atomic-swap value proposition.

## Architecture Evolution

We've decided to simplify the PrivateRPC architecture by focusing on a MetaMask Snap + microservice approach, removing the custom RPC routing/hijacking layer entirely. This approach offers better compatibility with existing dApps and wallets while still providing privacy features.

### Previous Approach (Deprecated)

The previous approach involved intercepting and modifying standard Ethereum RPC calls, which led to compatibility issues with existing dApps and wallets.

### New Approach

Our new approach consists of two main components:

1. **MetaMask Snap**: Handles user interaction and privacy features
2. **Microservice**: Provides backend functionality for atomic swaps

This approach resolves the following compatibility issues:

## Concrete Deliverables

### MetaMask Snap

The MetaMask Snap provides the following functionality:

```javascript
await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:private-rpc-snap',
    request: {
      method: 'prpc_createSwap',
      params: { amount: '0.1', direction: 'ETH→XMR', refundAddr: '...' }
    }
  }
});
```

The Snap:
- Calls the microservice REST API for atomic swap operations
- Manages Monero key operations via Lit Protocol integration
- Creates and signs EIP-712 meta-transactions for gas-less operations
- Provides enhanced privacy features like stealth addresses
- Handles user interaction through MetaMask's UI

### Microservice Backend

- RESTful API for atomic swap operations
- Integration with 1inch Fusion for Ethereum operations
- Integration with SwapD for Monero operations
- Secure one-time Monero key management via Lit Protocol
- Transaction relay functionality for meta-transactions

### Gas-Sponsorship Layer

- Deploy a minimal ERC-4337 paymaster (or use an existing one) that whitelists the microservice relayer
- The microservice now relays real user operations instead of spoofing gas estimates

### Lit Integration UX

- Inside the snap, embed Lit's encryption bundle; the snap requests the user to sign a session key once per 24h
- Monero secret is re-derived inside the snap; never shown to the web page

## Resulting User Flow

1. User installs the PrivateRPC MetaMask Snap
2. User interacts with dApps normally using their standard Ethereum provider
3. When the user wants to perform a private transaction or atomic swap:
   a. The user invokes the PrivateRPC Snap through MetaMask
   b. The Snap presents a UI for configuring the transaction
   c. The Snap communicates with the microservice to execute the operation
   d. The transaction is processed with enhanced privacy features

## Implementation Checklist

- [ ] Complete MetaMask Snap development
  - [ ] Implement core swap functionality
  - [ ] Add stealth address generation
  - [ ] Integrate with Lit Protocol for Monero key management
  - [ ] Create user-friendly UI components
- [ ] Enhance microservice backend
  - [ ] Implement RESTful API endpoints
  - [ ] Integrate with 1inch Fusion for transaction relay
  - [ ] Add support for meta-transactions
  - [ ] Improve SwapD integration
- [ ] Deploy or integrate ERC-4337 paymaster for gas sponsorship
- [ ] Publish Snap to MetaMask Snap directory
- [ ] Create developer documentation and examples

This approach removes the fundamental incompatibility while preserving the privacy and atomic-swap value proposition of PrivateRPC.

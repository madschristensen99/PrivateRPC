# 🔄 PrivateRPC Microservice

This microservice enables private, gas-less, atomic ETH ↔ XMR swaps by integrating the 1inch Fusion SDK (for Ethereum swaps), SwapD daemon (for Monero swaps), and Lit Protocol (for secure one-time Monero key management). It provides a RESTful API that the MetaMask Snap can interact with to provide privacy-enhanced transactions.

## 🚀 Features

- **Atomic ETH ↔ XMR Swaps**: Seamlessly swap between Ethereum and Monero with atomic guarantees
- **One-Time Monero Keys**: Generate secure, one-time use Monero keys using Lit Protocol
- **Modular Architecture**: Clean separation of concerns for better maintainability
- **RESTful API**: Clean API endpoints for MetaMask Snap integration
- **Security**: Comprehensive security middleware including rate limiting, CORS, and Helmet
- **MetaMask Snap Support**: Designed to work seamlessly with the PrivateRPC MetaMask Snap

## 🏗️ Architecture

The microservice follows a modular architecture:

- **Config**: Centralized configuration management
- **Controllers**: Business logic for handling requests
- **Routes**: API endpoint definitions
- **Services**: Core functionality implementations
  - `lit-client.ts`: One-time Monero key management with Lit Protocol
  - `swapd-client.ts`: Interface to SwapD daemon for Monero operations
  - `oneinch-service.ts`: Integration with 1inch Fusion SDK
  - `rpc-server.ts`: JSON-RPC server implementation
- **Middleware**: Cross-cutting concerns like authentication and error handling
- **Utils**: Shared utilities like logging

## 🔐 Lit Protocol Integration

This microservice integrates [Lit Protocol](https://developer.litprotocol.com/) to enhance the user experience for atomic swaps. While not strictly necessary for the atomic implementation itself, Lit Protocol automates Monero key management operations, particularly the claim step where funds are swept from the temporary wallet to the user's desired Monero address. This ensures compatibility with existing Web3 wallets that have no native support for Monero operations:

- **Secure Key Generation**: Keys are generated within Lit Protocol's Trusted Execution Environment (TEE)
- **One-Time Use**: Keys are programmatically restricted to be used only once for a specific transaction
- **Access Control**: Keys are tied to specific user and transaction IDs
- **No Key Exposure**: Private keys never leave the secure environment

The `LitClient` class in `services/lit-client.ts` provides the following functionality:

- Connect to Lit Protocol network
- Generate one-time Monero keys tied to transaction and user IDs
- Sign transactions using these keys within Lit's secure environment
- Derive Monero addresses from public keys
- Manage user authentication signatures

## 🛠️ Setup

1. 📦 Clone the repository (if not already done)
2. 🔧 Install dependencies:
   ```bash
   npm install
   ```
3. 🔑 Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file with the following required variables:
   ```
   PRIVATE_KEY=your_ethereum_private_key
   BASE_SEPOLIA_RPC_URL=your_base_sepolia_rpc_url
   ONEINCH_API_KEY=your_1inch_api_key
   SWAPD_RPC_URL=http://127.0.0.1:5000
   LIT_NETWORK=serrano
   API_KEY=your_api_key_for_authentication
   ```

## 💻 Development

Run the service in development mode:

```bash
npm run dev
```

Watch mode (auto-restart on file changes):

```bash
npm run watch
```

## 🏗️ Build

Build the TypeScript code:

```bash
npm run build
```

## 🚀 Production

Run the compiled service:

```bash
npm start
```

## 📝 API Endpoints

### RESTful API

#### Health Check
```
GET /health
```

#### Swap Operations
```
POST /api/swap/escrow              # Create an escrow for atomic swap
POST /api/swap/predict-escrow      # Predict escrow address
GET  /api/swap/order-status/:hash  # Get order status
POST /api/swap/integrated          # Create integrated ETH-XMR swap
GET  /api/swap/integrated/:id      # Get integrated swap status
```

#### SwapD Operations
```
GET  /api/swapd/ping               # Check SwapD daemon status
GET  /api/swapd/offers             # Get all swap offers
GET  /api/swapd/offers/:peerId     # Get offers from specific peer
POST /api/swapd/offers             # Create new swap offer
POST /api/swapd/take-offer         # Take an existing offer
GET  /api/swapd/swaps/ongoing      # Get ongoing swaps
GET  /api/swapd/swaps/past         # Get past swaps
GET  /api/swapd/swaps/:id/status   # Get swap status
DELETE /api/swapd/swaps/:id        # Cancel a swap
GET  /api/swapd/exchange-rate      # Get current exchange rate
GET  /api/swapd/balances           # Get wallet balances
```

### RESTful API Endpoints

The service exposes a RESTful API (default port 3000) with the following endpoints:

```
# Swap Operations
POST /api/createSwap         # Create a new atomic swap
GET  /api/getSwapStatus      # Get status of an existing swap
GET  /api/listSwaps          # List all swaps for a wallet
POST /api/cancelSwap         # Cancel an active swap
GET  /api/getExchangeRate    # Get current ETH-XMR exchange rate

# Monero Key Management
POST /api/generateMoneroKey   # Generate a one-time Monero key pair
POST /api/signMoneroTransaction # Sign a Monero transaction

# Transaction Relay
POST /api/relayTransaction    # Relay a meta-transaction via 1inch Fusion
```

> **Note**: These endpoints are designed to be called by the MetaMask Snap, providing a clean interface for privacy-enhanced operations.

## 🔄 Integration with Smart Contracts

This microservice interacts with the SwapCreatorAdapter contract deployed at:
- Base Sepolia: [`0x14Ab64a2f29f4921c200280988eea59c85266A33`](https://sepolia.basescan.org/address/0x14ab64a2f29f4921c200280988eea59c85266a33)

The SwapCreatorAdapter in turn interacts with the SwapCreator contract at:
- Base Sepolia: [`0x07b9c8BF96E553Adec406cC6ab8c41CCD3d53a51`](https://sepolia.basescan.org/address/0x07b9c8bf96e553adec406cc6ab8c41ccd3d53a51)

## 🧪 Testing

```bash
npm test
```

## 📚 Future Improvements

- Add comprehensive test suite
- Implement persistent storage for swap state
- Add monitoring and alerting
- Implement advanced error recovery mechanisms
- Add support for additional tokens and chains
- Enhance security with multi-factor authentication

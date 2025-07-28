# 🔒 PrivateRPC

Replace any Ethereum RPC endpoint with pRPC and your MetaMask (or any EIP-1193 wallet) gains private, gas-less, atomic ETH ↔ XMR swap based routing while remaining fully compatible with existing dApps.

<p align="center">
  <img src="assets/logo.jpg" alt="PrivateRPC Logo">
</p>

## How it works:
Only the following four methods are intercepted and re-written; all others are forwarded verbatim to the real Base-Sepolia node.
| Method                | Interception Logic                                                    | Return Value    |
| --------------------- | --------------------------------------------------------------------- | --------------- |
| `eth_getBalance`      | Query real balance, subtract **locked ETH** in `SwapCreator`          | `real - locked` |
| `eth_sendTransaction` | If `tx.to == SwapCreatorAdapter` → **atomic swap flow**; else forward | swap tx hash    |
| `eth_call`            | If calldata is `createEscrow` → fake success; else forward            | `0x` / success  |
| `eth_estimateGas`     | If calldata is `createEscrow` → fixed 200 k gas; else forward         | `0x30d40`       |

All other standard Ethereum RPC methods are passed through transparently to the underlying Base-Sepolia node.

## 🔄 1Inch Microservice

The 1Inch Microservice is the core component that powers PrivateRPC's drop-in Ethereum RPC replacement. It seamlessly intercepts specific JSON-RPC methods to enable private, gas-less, atomic ETH ↔ XMR swaps while maintaining full compatibility with existing dApps and wallets.


### 🔒 Atomic Swap Technology Stack

To enable trustless ETH ↔ XMR swaps, the microservice integrates three key technologies:

1. **1inch Fusion SDK**: Handles Ethereum operations and interacts with the SwapCreatorAdapter contract
2. **SwapD Daemon**: Manages Monero operations through its JSON-RPC API
3. **Lit Protocol**: Provides secure one-time Monero key management in a Trusted Execution Environment

### 🏗️ Architecture

The microservice follows a modular architecture designed for reliability and maintainability:

- **RPC Server**: Core JSON-RPC implementation that intercepts and modifies specific methods
- **Services Layer**:
  - `oneinch-service.ts`: Handles Ethereum operations via 1inch Fusion SDK
  - `swapd-client.ts`: Interfaces with SwapD daemon for Monero operations
  - `lit-client.ts`: Manages one-time Monero keys with Lit Protocol
- **Controllers & Routes**: Additional RESTful API endpoints for direct integration

### 📝 JSON-RPC Methods

The service exposes a standard Ethereum JSON-RPC server (default port 8545) that's fully compatible with MetaMask and other EIP-1193 wallets, with these key intercepted methods:

```
# Intercepted Standard Methods
eth_getBalance          # Returns (real balance - locked ETH)
eth_sendTransaction     # Triggers atomic swap flow for SwapCreatorAdapter transactions
eth_call                # Returns fake success for createEscrow calls
eth_estimateGas         # Returns fixed gas for createEscrow operations

# Additional Custom Methods
prpc_createSwap         # Create a new atomic swap directly
prpc_getSwapStatus      # Get status of an existing swap
prpc_listSwaps          # List all swaps for a wallet
prpc_getExchangeRate    # Get current ETH-XMR exchange rate
```

### 🔐 Secure Key Management with Lit Protocol

A critical innovation in this microservice is using [Lit Protocol](https://developer.litprotocol.com/) to solve the Monero key management problem:

- **One-Time Keys**: Generates secure, one-time use Monero keys for each swap
- **Trusted Execution**: Keys are generated and used within Lit's secure environment
- **Transaction Binding**: Keys are cryptographically bound to specific transactions
- **No Key Exposure**: Private keys never leave the secure environment

### 🛠️ Setup and Usage

1. Navigate to the 1InchMicroservice directory
2. Create a `.env` file based on `.env.example` with your configuration
3. Install dependencies: `npm install`
4. Build the TypeScript code: `npm run build`
5. Start the service: `npm start`

To use as a drop-in RPC replacement, simply point your wallet or dApp to the microservice's RPC endpoint (default: http://localhost:8545) instead of your regular Ethereum RPC provider.

## 🚀 Deployed Contracts

The following contracts have been deployed to Base Sepolia testnet:

- 📝 **SwapCreator**: `0x07b9c8BF96E553Adec406cC6ab8c41CCD3d53a51`
- 🔄 **SwapCreatorAdapter**: `0x14Ab64a2f29f4921c200280988eea59c85266A33`

## 🛠️ Setup

1. 📦 Clone this repository and its submodules:
   ```shell
   git clone --recursive <repository-url>
   ```

2. 🔧 Install Foundry if you haven't already:
   ```shell
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

3. 🔑 Create a `.env` file with your private key and RPC URL:
   ```
   PRIVATE_KEY=your_private_key_here
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   ETHERSCAN_API_KEY=optional_etherscan_api_key
   ```

## 💻 Building

```shell
$ forge build
```

## 🚀 Deployment

To deploy the contracts to Base Sepolia:

```shell
$ ./deploy-direct.sh
```

This script will:
1. 💰 Deploy the SwapCreator contract
2. 🔗 Deploy the SwapCreatorAdapter contract with the SwapCreator address

Alternatively, you can use the Foundry script:

```shell
$ forge script script/DeployContracts.s.sol --rpc-url base_sepolia --broadcast
```

## 🧹 Testing

```shell
$ forge test
```

# 🔒 PrivateRPC

PrivateRPC enables private, gas-less, atomic ETH ↔ XMR swaps through a MetaMask Snap and microservice architecture. This approach ensures full compatibility with existing dApps and wallets while providing enhanced privacy features.

<p align="center">
  <img src="assets/logo.jpg" alt="PrivateRPC Logo">
</p>

## 🔒 Architecture Overview

PrivateRPC consists of two main components:

### MetaMask Snap

- Install our MetaMask Snap for privacy-enhanced transactions
- Automatic transaction interception and privacy enhancement
- Advanced features like stealth addresses and zero-knowledge proofs
- Seamless atomic ETH ↔ XMR swaps
- User-friendly interface integrated directly into MetaMask

### Microservice Backend

- RESTful API for atomic swap operations
- Integration with 1inch Fusion for Ethereum operations
- Integration with SwapD for Monero operations
- Lit Protocol for secure one-time Monero key management

This clean architecture ensures full compatibility with existing dApps while providing enhanced privacy features through the optional MetaMask Snap.

## 🔒 Privacy Features

### Private Funding

A key innovation in PrivateRPC is its approach to private funding of transactions:

- **Transaction Origin Privacy**: By using resolver-sponsored transactions through SwapCreator.sol's Relay feature, the original funding source is decoupled from the transaction execution
- **Address Isolation**: Each swap uses fresh addresses, preventing address clustering and chain analysis
- **Cross-Chain Privacy**: Moving between ETH and XMR creates a fundamental break in the transaction graph that's impossible to trace through conventional means


## 🔄 Microservice Backend

The microservice backend is the core component that powers PrivateRPC's atomic swap functionality. It provides:

- RESTful API for atomic swap operations
- Integration with 1inch Fusion for Ethereum operations
- Integration with SwapD daemon for Monero operations
- Secure one-time Monero key management via Lit Protocol
- Support for MetaMask Snap integration

For detailed setup and running instructions, see the [1InchMicroservice README](https://github.com/madschristensen99/PrivateRPC/tree/main/1InchMicroservice).

## 🔄 Fusion + Contract Integration

### 🔗 Contract Architecture

- **SwapCreator**: Core contract that manages the atomic swap logic and holds ETH in escrow
- **SwapCreatorAdapter**: Adaptor contract that implements the IEscrowSrc interface

### 🚀 Fusion + Integration

- **Gas Sponsorship**: Transactions are sponsored by resolvers, enabling private funding of addresses
- **Atomic Guarantees**: Smart contract ensures that swaps either complete fully or revert entirely
- **Resolver Competition**: Multiple resolvers can compete to execute swaps, optimizing for best rates

### 🛠️ Setup and Usage

1. Navigate to the 1InchMicroservice directory
2. Create a `.env` file based on `.env.example` with your configuration
3. Install dependencies: `npm install`
4. Build the TypeScript code: `npm run build`
5. Start the service: `npm start`

To use as a drop-in RPC replacement, simply point your wallet or dApp to the microservice's RPC endpoint (default: http://localhost:8545) instead of your regular Ethereum RPC provider.

## 🚀 Deployed Contracts

The following contracts have been deployed to Base Sepolia testnet:

- 📝 **SwapCreator**: [`0x07b9c8BF96E553Adec406cC6ab8c41CCD3d53a51`](https://sepolia.basescan.org/address/0x07b9c8bf96e553adec406cc6ab8c41ccd3d53a51)
- 🔄 **SwapCreatorAdapter**: [`0x14Ab64a2f29f4921c200280988eea59c85266A33`](https://sepolia.basescan.org/address/0x14ab64a2f29f4921c200280988eea59c85266a33)

## 🛠️ Foundry Setup

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

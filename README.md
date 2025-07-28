# 🔒 PrivateRPC

Replace any Ethereum RPC endpoint with a Private RPC and your MetaMask (or any EIP-1193 wallet) gains private, gas-less, atomic ETH ↔ XMR swap based transaction routing while remaining fully compatible with existing dApps.

<p align="center">
  <img src="assets/logo.jpg" alt="PrivateRPC Logo">
</p>

## How it works:
Only the following four methods are intercepted and re-written; all others are forwarded verbatim to the real Base-Sepolia node.
| Method                | Interception Logic                                                    | Return Value    |
| --------------------- | --------------------------------------------------------------------- | --------------- |
| `eth_getBalance`      | Query combined balance from collection of addresses associated with the user          | `combined balance` |
| `eth_sendTransaction` | If `tx.to == SwapCreatorAdapter` → **atomic swap flow**; else forward | swap tx hash    |
| `eth_call`            | If calldata is `createEscrow` → fake success; else forward            | `0x` / success  |
| `eth_estimateGas`     | If calldata is `createEscrow` → fixed 200 k gas; else forward         | `0x30d40`       |

All other standard Ethereum RPC methods are passed through transparently to the underlying Base-Sepolia node.

## 🔒 Privacy Features

### Private Funding

A key innovation in PrivateRPC is its approach to private funding of transactions:

- **Transaction Origin Privacy**: By using resolver-sponsored transactions through SwapCreator.sol
s Relay feature, the original funding source is decoupled from the transaction execution
- **Address Isolation**: Each swap uses fresh addresses, preventing address clustering and chain analysis
- **Cross-Chain Privacy**: Moving between ETH and XMR creates a fundamental break in the transaction graph that's impossible to trace through conventional means


## 🔄 1Inch Microservice

The 1Inch Microservice is the core component that powers PrivateRPC's drop-in Ethereum RPC replacement. It intercepts specific JSON-RPC methods and routes them though gas sponsored, atomic ETH ↔ XMR swaps while maintaining full compatibility with existing dApps and wallets. It also integrates with the swap daemon from the xmr-eth-atomic-swap repository to facilitate the atomic swap process.

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

- 📝 **SwapCreator**: `0x07b9c8BF96E553Adec406cC6ab8c41CCD3d53a51`
- 🔄 **SwapCreatorAdapter**: `0x14Ab64a2f29f4921c200280988eea59c85266A33`

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

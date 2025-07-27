# 🛡️ Hashield: Secure cross-chain transactions with Monero-Ethereum atomic swaps

Web3 wallet extension build on a secure, modular implementation for trustless atomic swaps between EVM chains (Ethereum, Base, etc.) and Monero. Built on 1Inch's escrow interface with adapter-based architecture for maximum flexibility and security.

## 🏗️ Architecture Overview

This system implements **Adapter Signatures** to enable atomic swaps between EVM chains and Monero:

- **EVM Side**: Smart contracts with deterministic factory deployment and adapter pattern
- **Monero Side**: Native Monero cryptographic primitives for secure transactions
- **Atomic Guarantee**: Either both parties get their desired assets, or both get refunded

### 🔄 Supported Swap Directions

1. **EVM → XMR**: Trade ETH/ERC20 tokens for Monero
2. **XMR → EVM**: Trade Monero for ETH/ERC20 tokens

## 🧱 Technical Components

### Smart Contracts (EVM)
- `XMREscrowFactory`: Creates escrow contracts using deterministic deployment (Create2)
- `XMREscrowSrc`: Source escrow for XMR→EVM swaps
- `XMREscrowDst`: Destination escrow for EVM→XMR swaps
- `XMRSwapAdapter`: Adapter contract connecting escrows with the SwapCreator
- `SwapCreator`: Existing implementation of ETH-XMR atomic swap contract
- **Deployed on Base Sepolia**: Check deployment files for latest addresses

### Key Features
- ✅ **Modular Architecture**: Adapter pattern for easy integration and upgrades
- ✅ **1-inch Compatible**: Deposit wrapper interface for aggregator compatibility
- ✅ **Deterministic Deployment**: Create2 for predictable contract addresses
- ✅ **Privacy-Preserving**: Works with Monero's privacy features
- ✅ **Gas Optimized**: Minimal proxy pattern for efficient deployment

## 🚀 Quick Start

### Prerequisites
```bash
# Node.js 18+
node --version

# Git
git --version
```

### Environment Setup
Create `.env` file:
```bash
# EVM Configuration
PRIVATE_KEY=your_ethereum_private_key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
ETHERSCAN_API_KEY=your_etherscan_key
BASESCAN_API_KEY=your_basescan_key

# Monero Configuration
MONERO_WALLET_RPC=http://localhost:18083/json_rpc
MONERO_DAEMON_RPC=http://localhost:18081/json_rpc
MONERO_WALLET_PASSWORD=your_wallet_password
```

### Get Testnet Funds
- **Base Sepolia ETH**: [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-sepolia-faucet)
- **Monero Stagenet**: [Monero Stagenet Faucet](https://stagenet-faucet.xmr.to/)

### Installation
```bash
# Clone the repository
git clone https://github.com/hashlocked-xyz/hashield.git
cd hashield

# Install dependencies
npm install

# Compile contracts
cd evm
npx hardhat compile
```

## 💱 Swap Flows

### 🔵 EVM → XMR Flow

**Participants**: MAKER (provides ETH/ERC20), TAKER (provides XMR)

```bash
# 1. Deploy contracts if needed
npx hardhat run scripts/deploy-xmr.ts --network base-sepolia

# 2. MAKER creates escrow with funds
npx hardhat run scripts/create-src-escrow.ts --network base-sepolia

# 3. TAKER sends XMR to MAKER's Monero address
# (Using Monero wallet software)

# 4. MAKER verifies XMR transaction and reveals secret
npx hardhat run scripts/reveal-secret.ts --network base-sepolia

# 5. TAKER claims ETH/ERC20 using revealed secret
npx hardhat run scripts/claim-src-escrow.ts --network base-sepolia
```

### 🔴 XMR → EVM Flow

**Participants**: MAKER (provides XMR), TAKER (provides ETH/ERC20)

```bash
# 1. TAKER creates escrow with funds
npx hardhat run scripts/create-dst-escrow.ts --network base-sepolia

# 2. MAKER sends XMR to TAKER's Monero address
# (Using Monero wallet software)

# 3. MAKER provides proof of XMR payment
npx hardhat run scripts/record-xmr-tx.ts --network base-sepolia

# 4. TAKER verifies XMR transaction and releases ETH/ERC20
npx hardhat run scripts/claim-dst-escrow.ts --network base-sepolia
```

## 🔐 Cryptographic Flow

### Secret & Hashlock Generation
```javascript
// 1. Generate random 32-byte secret
const secret = crypto.randomBytes(32);
const secretHex = "0x" + secret.toString("hex");

// 2. Create keccak256 hashlock
const hashlock = ethers.keccak256(secretHex);

// 3. Use in both EVM contracts and Monero transactions
```

### Atomic Swap Guarantee
1. **Setup Phase**: Both parties lock assets using same hashlock
2. **Claim Phase**: First claimer reveals secret, second uses revealed secret
3. **Safety**: If either fails, both get refunded after timelock

## 🛡️ Security Features

### Hash Time Locked Contracts (HTLCs)
- **Hashlock**: Keccak256 hash ensures atomic execution
- **Timelock**: Automatic refunds prevent fund loss
- **Adapter Pattern**: Centralized swap state management

### Key Protections
- **No Counterparty Risk**: Trustless execution
- **Atomic Guarantee**: Both succeed or both fail
- **Replay Protection**: Each swap uses unique hashlock
- **Time Boundaries**: Configurable timelock periods

## 🔧 Configuration

### Timelock Settings
```javascript
timelock: {
  withdrawalPeriod: 3600,     // 1 hour until withdrawal allowed
  cancellationPeriod: 86400   // 24 hour safety period before refund
}
```

### Network Support
- **EVM**: Base Sepolia (testnet), easily extendable to mainnet and other EVM chains
- **Monero**: Stagenet, ready for mainnet

## 📄 Smart Contract Details

### XMREscrowFactory
```solidity
// Create source escrow (EVM→XMR) using Create2 for deterministic addresses
function createSrcEscrow(bytes32 salt, Immutables memory immutables) external returns (address) {
    // Implementation uses minimal proxy pattern for gas efficiency
}
```

### XMREscrowSrc
```solidity
// Deposit function for 1-inch compatibility
function deposit(
    bytes32 hashlock,
    bytes32 claimCommitment,
    bytes32 refundCommitment,
    Immutables calldata immutables
) external payable {
    // Creates swap via adapter
}
```

### XMRSwapAdapter
```solidity
// Create swap in SwapCreator
function createSwap(
    bytes32 hashlock,
    bytes32 claimCommitment,
    bytes32 refundCommitment,
    address payable claimer,
    uint256 timeout1,
    uint256 timeout2,
    address asset,
    uint256 value,
    uint256 nonce
) external payable returns (bytes32) {
    // Handles token transfers and creates swap
}
```

## 📚 Development

### Testing
```bash
# Run tests
npx hardhat test

# Run specific test file
npx hardhat test test/XMREscrow.test.ts
```

### Deployment
```bash
# Deploy to Base Sepolia
npx hardhat run scripts/deploy-xmr.ts --network base-sepolia
```

## 📜 License

MIT
    external payable returns (address)

// Create destination escrow (BTC→EVM)  
function createDstEscrow(Immutables memory immutables)
    external payable returns (address)
```

### Immutables Structure
```solidity
struct Immutables {
    bytes32 orderHash;    // Unique order identifier
    bytes32 hashlock;     // SHA-256 hash of secret
    uint256 maker;        // Maker address as uint256
    uint256 taker;        // Taker address as uint256
    uint256 token;        // Token address (0 = ETH)
    uint256 amount;       // Amount in wei
    uint256 safetyDeposit;// Safety deposit
    uint256 timelocks;    // Packed timelock data
}
```

## 🐛 Troubleshooting

### Common Issues

**"Non-canonical DER signature"**
```bash
# Fixed in current version - signatures now properly DER-encoded
```

**"Order missing taker info"**
```bash
# Check flow order - ensure previous steps completed
# Verify order file exists in orders/ directory
```

**"Insufficient balance"**
```bash
# Check both ETH and BTC testnet balances
# Ensure sufficient gas fees
```

**"HTLC address not found"**
```bash
# Verify Bitcoin HTLC was created successfully
# Check order file has bitcoinHTLC.address field
```

### Debug Commands
```bash
# Check order status
cat orders/order_123.json | jq '.status'

# Verify contract deployment
npm run debug:timelock

# Check Bitcoin HTLC
ls btc/output/htlc_*_testnet4.json
```

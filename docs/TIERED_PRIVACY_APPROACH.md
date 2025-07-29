# 🛡️ PrivateRPC: Tiered Privacy Approach

This document outlines a tiered approach to privacy for PrivateRPC, allowing users to choose their level of privacy while maintaining compatibility with existing wallets and dApps.

## Overview

The tiered privacy approach separates PrivateRPC into two layers:

1. **PrivateRPC Base Layer**: A clean RPC service with minimal modifications to standard JSON-RPC methods
2. **Privacy Snap**: An optional MetaMask Snap that provides advanced privacy features

This approach allows users to start with basic privacy and upgrade to maximum privacy when needed, without changing their existing workflow.

## 1. PrivateRPC (Base Layer)

### Features

- **Clean RPC with Few Intentional Overrides**: The base layer provides a clean RPC service with minimal modifications to standard JSON-RPC methods
- **Handles Balance Queries and Gas Estimation Normally**: The RPC service forwards standard methods like `eth_getBalance`, `eth_estimateGas`, and others to the underlying Ethereum node without modification
- **`prpc_` Namespace for Explicit Swap Endpoints**: Introduces a custom namespace (`prpc_*`) for atomic swap-related methods, explicitly called by the Snap or other compatible tools
- **Works with Any Wallet**: Any standard Ethereum wallet (like MetaMask) can use this RPC service without needing special integration

### Example

- Users can point their MetaMask to the PrivateRPC endpoint and use it for normal Ethereum transactions without any issues
- For atomic swaps, they would use the custom `prpc_*` methods provided by the Snap

## 2. Snap (Privacy Upgrade)

### Features

- **Intercepts Any Transaction Type Automatically**: The Snap can intercept transactions and provide additional privacy features
- **Stealth Addresses, ZK Proofs, Full Relayer Network**: The Snap can use advanced techniques like stealth addresses, zero-knowledge proofs, and a full relayer network to enhance privacy
- **Install Snap for Full Privacy**: Users can opt-in to advanced privacy features by installing the Snap, which is optional and only required for users who want maximum privacy

### Example

- Users who want basic privacy can use the PrivateRPC endpoint with their standard wallet
- Users who want maximum privacy can install the Snap, which will handle transactions with enhanced privacy features

## User Journey

### Basic Privacy

1. User points their MetaMask to the PrivateRPC endpoint
2. User performs normal Ethereum transactions using their wallet
3. For atomic swaps, the user uses the custom `prpc_*` methods provided by the Snap (if they have it installed)

### Maximum Privacy

1. User installs the PrivateRPC Snap
2. User continues using their MetaMask normally
3. The Snap intercepts transactions and applies advanced privacy features like stealth addresses and zero-knowledge proofs
4. For atomic swaps, the Snap handles the entire process, ensuring maximum privacy

## Implementation Details

### PrivateRPC Service

- **Standard Methods**: Forward standard JSON-RPC methods to the underlying Ethereum node
- **Custom Namespace**: Implement custom methods under the `prpc_*` namespace for atomic swaps and other privacy features

### MetaMask Snap

- **Interception**: The Snap can intercept transactions and apply privacy features
- **User Interaction**: Prompt users for necessary inputs and approvals
- **Backend Communication**: Communicate with the PrivateRPC service for custom methods

## Benefits

- **Broad Compatibility**: The base layer ensures that PrivateRPC works with any standard wallet, providing broad compatibility
- **Advanced Privacy Opt-In**: Users can opt-in to advanced privacy features by installing the Snap, providing a tiered privacy approach
- **User Control**: Users have control over their privacy level, choosing between basic and maximum privacy based on their needs
- **Seamless Integration**: This approach interfaces nicely with the existing codebase, requiring minimal changes to the current implementation

## Integration with Current Codebase

The tiered approach can be implemented with the following changes to the current codebase:

1. **Modify RPC Server**: Update the RPC server to forward standard methods to the underlying node and implement the `prpc_*` namespace
2. **Develop MetaMask Snap**: Create a new MetaMask Snap that intercepts transactions and applies privacy features
3. **Update Documentation**: Clearly document the two privacy tiers and how users can choose between them

## Conclusion

This tiered privacy approach provides a balanced solution that caters to both broad compatibility and advanced privacy needs. By separating the base layer (PrivateRPC) from the privacy upgrade (Snap), users get a flexible and user-friendly experience that allows them to start with basic privacy and upgrade to maximum privacy when ready, without changing their existing workflow.

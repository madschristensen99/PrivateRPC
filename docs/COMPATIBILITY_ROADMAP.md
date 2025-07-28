# 🔄 PrivateRPC Compatibility Roadmap

This document outlines the plan to make PrivateRPC fully compatible with existing wallets and dApps while preserving its privacy and atomic-swap value proposition.

## Current Compatibility Issues

| Compatibility Problem | Current Behaviour | Fix | Rationale |
| --------------------- | ---------------- | --- | --------- |
| 1. ETH balance spoofing | `eth_getBalance` returns "virtual" ETH (sum of many addresses) | Stop spoofing. Provide a proxy wallet that holds real ETH and relays gasless meta-txs | Every DeFi contract uses `balanceOf` / `eth_getBalance`. Lying breaks them |
| 2. Gas spoofing (`eth_estimateGas`) | Returns hard-coded 200k | Forward the call to the real node, then add a buffer for meta-tx overhead | dApps compute slippage, vault limits, etc. from gas limits |
| 3. `eth_call` spoofing | Returns fake success for `createEscrow` | Remove the override; let the real call run | View functions are used by front-ends for permit checks, pricing, etc. |
| 4. Swap-only hijacking | Only `tx.to == SwapCreatorAdapter` is handled | Expose a new JSON-RPC namespace (`prpc_*`) and a wallet snap that translates intents into meta-tx calldata | Keeps the rest of the RPC surface 100% transparent |
| 5. Monero key UX | Lit TEE key must sign Monero TX | Wrap Lit action in a MetaMask snap that appears as a "sign external transaction" popup | Users never leave their wallet; no extra seed phrase |

## Concrete Deliverables

### Snap / Wallet Plugin

Adds `wallet_invokeSnap` method:

```javascript
await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:private-swap-snap',
    request: {
      method: 'prpc_createSwap',
      params: { amount: '0.1', direction: 'ETH→XMR', refundAddr: '...' }
    }
  }
});
```

Snap internally calls the microservice REST API, fetches the Lit-signed Monero key, and returns an EIP-712 meta-tx that the microservice can relay via 1inch-Fusion.

### RPC Proxy Mode

- Add a flag (`COMPAT_MODE=true`) that disables all four hijacks
- When enabled, the service behaves like a normal Base-Sepolia RPC except for the new `prpc_*` namespace
- Wallet snaps explicitly call `prpc_*` when they need the swap flow, so normal dApps never notice

### Gas-Sponsorship Layer

- Deploy a minimal ERC-4337 paymaster (or use an existing one) that whitelists the microservice relayer
- The microservice now relays real user operations instead of spoofing gas estimates

### Lit Integration UX

- Inside the snap, embed Lit's encryption bundle; the snap requests the user to sign a session key once per 24h
- Monero secret is re-derived inside the snap; never shown to the web page

## Resulting User Flow

1. User keeps MetaMask pointed to any standard Base-Sepolia RPC (Alchemy, Infura, etc.)
2. When they want a private ETH↔XMR swap, they open the snap (or a dApp that embeds the snap)
3. Snap asks for amount & direction, obtains Lit-signed Monero key, builds meta-tx
4. Meta-tx is sent to the microservice via REST; microservice relays via 1inch-Fusion + ERC-4337 paymaster
5. All other dApp interactions (Uniswap, NFT mint, etc.) continue unchanged

## Migration Checklist

- [ ] Remove overrides for `eth_getBalance`, `eth_estimateGas`, `eth_call`, `eth_sendTransaction`
- [ ] Implement `COMPAT_MODE` flag
- [ ] Publish `private-swap-snap` to the MetaMask Snaps registry
- [ ] Provide a one-click "add snap" button on your landing page
- [ ] Update README: deprecate "drop-in RPC replacement", advertise "install snap + keep your existing RPC"

This approach removes the fundamental incompatibility while preserving the privacy and atomic-swap value proposition of PrivateRPC.

import { ethers } from 'ethers';

/**
 * Interface for a meta-transaction.
 */
export interface MetaTransaction {
  to: string;
  data: string;
  value: string;
  gas: string;
  nonce: string;
  deadline: string;
  signature: string;
}

/**
 * Create a meta-transaction for enhanced privacy.
 * 
 * @param to - The target contract address.
 * @param data - The transaction data.
 * @param value - The transaction value in wei.
 * @returns The meta-transaction.
 */
export async function createMetaTransaction(
  to: string,
  data: string,
  value: string,
): Promise<MetaTransaction> {
  try {
    // Get the user's Ethereum address and private key
    const bip44Node = await snap.request({
      method: 'snap_getBip44Entropy',
      params: {
        coinType: 60, // Ethereum
      },
    });

    // Get the provider from the snap's state
    const state = await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    });

    const rpcUrl = state?.rpcUrl || 'http://localhost:8545';
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    // Create a wallet instance
    const wallet = new ethers.Wallet(bip44Node.privateKey, provider);

    // Get the current nonce
    const nonce = await provider.getTransactionCount(wallet.address);

    // Get the current block timestamp
    const block = await provider.getBlock('latest');
    const deadline = block.timestamp + 3600; // 1 hour from now

    // Create the meta-transaction
    const metaTx = {
      to,
      data,
      value,
      gas: '200000', // Default gas limit
      nonce: nonce.toString(),
      deadline: deadline.toString(),
      signature: '',
    };

    // Create the EIP-712 domain
    const domain = {
      name: 'PrivateRPC',
      version: '1',
      chainId: (await provider.getNetwork()).chainId,
      verifyingContract: to,
    };

    // Create the EIP-712 types
    const types = {
      MetaTransaction: [
        { name: 'to', type: 'address' },
        { name: 'data', type: 'bytes' },
        { name: 'value', type: 'uint256' },
        { name: 'gas', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    // Sign the meta-transaction
    const signature = await wallet._signTypedData(domain, types, {
      to: metaTx.to,
      data: metaTx.data,
      value: metaTx.value,
      gas: metaTx.gas,
      nonce: metaTx.nonce,
      deadline: metaTx.deadline,
    });

    metaTx.signature = signature;

    return metaTx;
  } catch (error) {
    console.error('Error creating meta-transaction:', error);
    throw error;
  }
}

/**
 * Create a stealth address for enhanced privacy.
 * 
 * @returns The stealth address details.
 */
export async function createStealthAddress(): Promise<{ address: string; privateKey: string }> {
  // Generate a random wallet
  const wallet = ethers.Wallet.createRandom();

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Submit a transaction through the PrivateRPC relay network.
 * 
 * @param metaTx - The meta-transaction to submit.
 * @returns The transaction hash.
 */
export async function submitViaRelay(metaTx: MetaTransaction): Promise<string> {
  try {
    // Get the API URL from the snap's state
    const state = await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    });

    const apiUrl = state?.apiUrl || 'http://localhost:3000/api';

    // Call the PrivateRPC microservice to submit the transaction
    const response = await fetch(`${apiUrl}/relayTransaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metaTx),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to relay transaction');
    }

    const result = await response.json();
    return result.txHash;
  } catch (error) {
    console.error('Error submitting transaction via relay:', error);
    throw error;
  }
}

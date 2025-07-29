import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text, heading, divider } from '@metamask/snaps-ui';
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';
import { ethers } from 'ethers';

/**
 * Handle incoming JSON-RPC requests from the dapp or MetaMask UI.
 * 
 * @param params - The request parameters.
 * @param params.request - The JSON-RPC request object.
 * @returns The JSON-RPC response.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  const { method, params } = request;

  // Get the user's Ethereum address
  const ethereumAddress = await getEthereumAddress();

  // Handle different RPC methods
  switch (method) {
    case 'prpc_getInfo':
      return {
        name: 'PrivateRPC Snap',
        version: '0.1.0',
        ethereumAddress,
      };

    case 'prpc_createSwap':
      return handleCreateSwap(params);

    case 'prpc_getSwapStatus':
      return handleGetSwapStatus(params);

    case 'prpc_listSwaps':
      return handleListSwaps();

    case 'prpc_cancelSwap':
      return handleCancelSwap(params);

    case 'prpc_getExchangeRate':
      return handleGetExchangeRate();

    default:
      throw new Error(`Method not found: ${method}`);
  }
};

/**
 * Get the user's Ethereum address from the MetaMask wallet.
 * 
 * @returns The user's Ethereum address.
 */
async function getEthereumAddress(): Promise<string> {
  // Get the BIP-44 entropy for Ethereum
  const bip44Node = await snap.request({
    method: 'snap_getBip44Entropy',
    params: {
      coinType: 60, // Ethereum
    },
  });

  // Derive the Ethereum address
  const addressKeyDeriver = await getBIP44AddressKeyDeriver(bip44Node);
  const { privateKey, address } = await addressKeyDeriver(0);

  return address;
}

/**
 * Handle creating a new atomic swap.
 * 
 * @param params - The swap parameters.
 * @returns The swap result.
 */
async function handleCreateSwap(params: any): Promise<any> {
  try {
    // Show confirmation dialog to user
    const confirmed = await snap.request({
      method: 'snap_dialog',
      params: {
        type: 'confirmation',
        content: panel([
          heading('Create Atomic Swap'),
          text(`You are about to create an atomic swap with the following parameters:`),
          divider(),
          text(`Amount: ${params.amount} ${params.direction.split('→')[0]}`),
          text(`Direction: ${params.direction}`),
          text(`Refund Address: ${params.refundAddr}`),
          divider(),
          text('This operation will be processed privately through PrivateRPC.'),
        ]),
      },
    });

    if (!confirmed) {
      return { success: false, error: 'User rejected the swap' };
    }

    // Call the PrivateRPC microservice to create the swap
    const response = await callPrivateRpcApi('createSwap', params);

    // Store the swap details in the snap's state
    await storeSwapDetails(response.swapId, params);

    return response;
  } catch (error) {
    console.error('Error creating swap:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle getting the status of an existing swap.
 * 
 * @param params - The swap parameters.
 * @returns The swap status.
 */
async function handleGetSwapStatus(params: any): Promise<any> {
  try {
    // Call the PrivateRPC microservice to get the swap status
    const response = await callPrivateRpcApi('getSwapStatus', { swapId: params.swapId });
    return response;
  } catch (error) {
    console.error('Error getting swap status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle listing all swaps for the current user.
 * 
 * @returns The list of swaps.
 */
async function handleListSwaps(): Promise<any> {
  try {
    // Get the user's Ethereum address
    const ethereumAddress = await getEthereumAddress();

    // Call the PrivateRPC microservice to list swaps
    const response = await callPrivateRpcApi('listSwaps', { address: ethereumAddress });
    return response;
  } catch (error) {
    console.error('Error listing swaps:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle cancelling an existing swap.
 * 
 * @param params - The swap parameters.
 * @returns The cancel result.
 */
async function handleCancelSwap(params: any): Promise<any> {
  try {
    // Show confirmation dialog to user
    const confirmed = await snap.request({
      method: 'snap_dialog',
      params: {
        type: 'confirmation',
        content: panel([
          heading('Cancel Atomic Swap'),
          text(`You are about to cancel the swap with ID: ${params.swapId}`),
          divider(),
          text('This operation cannot be undone.'),
        ]),
      },
    });

    if (!confirmed) {
      return { success: false, error: 'User rejected the cancellation' };
    }

    // Call the PrivateRPC microservice to cancel the swap
    const response = await callPrivateRpcApi('cancelSwap', { swapId: params.swapId });
    return response;
  } catch (error) {
    console.error('Error cancelling swap:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle getting the current ETH-XMR exchange rate.
 * 
 * @returns The exchange rate.
 */
async function handleGetExchangeRate(): Promise<any> {
  try {
    // Call the PrivateRPC microservice to get the exchange rate
    const response = await callPrivateRpcApi('getExchangeRate', {});
    return response;
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Call the PrivateRPC microservice API.
 * 
 * @param endpoint - The API endpoint.
 * @param data - The request data.
 * @returns The API response.
 */
async function callPrivateRpcApi(endpoint: string, data: any): Promise<any> {
  // Get the API URL from the snap's state
  const state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });

  const apiUrl = state?.apiUrl || 'http://localhost:3000/api';

  // Make the API request
  const response = await fetch(`${apiUrl}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
}

/**
 * Store swap details in the snap's state.
 * 
 * @param swapId - The swap ID.
 * @param params - The swap parameters.
 */
async function storeSwapDetails(swapId: string, params: any): Promise<void> {
  // Get the current state
  const state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  }) || { swaps: {} };

  // Add the new swap to the state
  const swaps = state.swaps || {};
  swaps[swapId] = {
    ...params,
    createdAt: Date.now(),
  };

  // Update the state
  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState: {
        ...state,
        swaps,
      },
    },
  });
}

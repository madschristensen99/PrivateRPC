import React, { useState, useEffect } from 'react';

interface MoneroWalletProps {
  isWalletInitialized: boolean;
}

interface MoneroBalanceState {
  total: string;
  unlocked: string;
  loading: boolean;
  error: string | null;
}

interface MoneroAddressState {
  address: string;
  loading: boolean;
  error: string | null;
}

interface MoneroTransactionState {
  address: string;
  amount: string;
  paymentId: string;
  priority: number;
  sending: boolean;
  error: string | null;
  success: boolean;
  txHash: string | null;
}

interface MoneroSubaddressState {
  label: string;
  creating: boolean;
  address: string | null;
  error: string | null;
}

const MoneroWallet: React.FC<MoneroWalletProps> = ({ isWalletInitialized }) => {
  // State for Monero wallet data
  const [balance, setBalance] = useState<MoneroBalanceState>({
    total: '0',
    unlocked: '0',
    loading: false,
    error: null
  });
  
  const [address, setAddress] = useState<MoneroAddressState>({
    address: '',
    loading: false,
    error: null
  });
  
  const [transaction, setTransaction] = useState<MoneroTransactionState>({
    address: '',
    amount: '',
    paymentId: '',
    priority: 1,
    sending: false,
    error: null,
    success: false,
    txHash: null
  });
  
  const [subaddress, setSubaddress] = useState<MoneroSubaddressState>({
    label: '',
    creating: false,
    address: null,
    error: null
  });
  
  const [showSendForm, setShowSendForm] = useState(false);
  const [showSubaddressForm, setShowSubaddressForm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    percentDone: number;
    message: string;
  }>({
    percentDone: 0,
    message: ''
  });
  
  // Load Monero address and balance on component mount
  useEffect(() => {
    if (isWalletInitialized) {
      loadMoneroAddress();
      loadMoneroBalance();
      checkSyncStatus();
      
      // Listen for sync progress updates
      const listener = (message: any) => {
        if (message.type === 'moneroSyncProgress') {
          setSyncStatus({
            percentDone: message.data.percentDone,
            message: message.data.message
          });
        }
        
        if (message.type === 'moneroOutputReceived') {
          // Refresh balance when new output is received
          loadMoneroBalance();
        }
      };
      
      chrome.runtime.onMessage.addListener(listener);
      
      return () => {
        chrome.runtime.onMessage.removeListener(listener);
      };
    }
  }, [isWalletInitialized]);
  
  // Load Monero address
  const loadMoneroAddress = async () => {
    setAddress(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'getMoneroAddress' });
      
      if (response.error) {
        setAddress(prev => ({ ...prev, loading: false, error: response.error }));
      } else {
        setAddress({
          address: response.address,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      setAddress(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  };
  
  // Load Monero balance
  const loadMoneroBalance = async () => {
    setBalance(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'getMoneroBalance' });
      
      if (response.error) {
        setBalance(prev => ({ ...prev, loading: false, error: response.error }));
      } else {
        setBalance({
          total: response.total,
          unlocked: response.unlocked,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      setBalance(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  };
  
  // Check sync status
  const checkSyncStatus = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'getMoneroWalletStatus' });
      if (response && !response.error) {
        setIsSyncing(response.syncing);
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  };
  
  // Start manual sync
  const startSync = async () => {
    setIsSyncing(true);
    
    try {
      await chrome.runtime.sendMessage({ type: 'syncMoneroWallet' });
    } catch (error) {
      console.error('Error starting sync:', error);
    }
  };
  
  // Send Monero transaction
  const sendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTransaction(prev => ({ ...prev, sending: true, error: null, success: false, txHash: null }));
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'sendMoneroTransaction',
        address: transaction.address,
        amount: transaction.amount,
        paymentId: transaction.paymentId,
        priority: transaction.priority
      });
      
      if (response.error) {
        setTransaction(prev => ({ ...prev, sending: false, error: response.error }));
      } else {
        setTransaction(prev => ({
          ...prev,
          sending: false,
          success: true,
          txHash: response.txHash,
          address: '',
          amount: '',
          paymentId: ''
        }));
        
        // Refresh balance after sending
        loadMoneroBalance();
      }
    } catch (error) {
      setTransaction(prev => ({ 
        ...prev, 
        sending: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  };
  
  // Create subaddress
  const createSubaddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubaddress(prev => ({ ...prev, creating: true, error: null, address: null }));
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'createMoneroSubaddress',
        label: subaddress.label
      });
      
      if (response.error) {
        setSubaddress(prev => ({ ...prev, creating: false, error: response.error }));
      } else {
        setSubaddress({
          label: '',
          creating: false,
          address: response.address,
          error: null
        });
      }
    } catch (error) {
      setSubaddress(prev => ({ 
        ...prev, 
        creating: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  };
  
  // Format Monero amount for display (1 XMR = 1e12 atomic units)
  const formatMoneroAmount = (atomicUnits: string): string => {
    const amount = BigInt(atomicUnits);
    const whole = amount / BigInt(1e12);
    const fraction = amount % BigInt(1e12);
    
    // Format with 12 decimal places
    const fractionStr = fraction.toString().padStart(12, '0');
    
    // Trim trailing zeros
    const trimmedFraction = fractionStr.replace(/0+$/, '');
    
    return `${whole}${trimmedFraction ? '.' + trimmedFraction : ''} XMR`;
  };
  
  // Copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Address copied to clipboard!');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };
  
  if (!isWalletInitialized) {
    return (
      <div style={{
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        marginTop: '15px'
      }}>
        <h3 style={{ color: '#495057', textAlign: 'center' }}>Monero Wallet</h3>
        <p style={{ textAlign: 'center', color: '#6c757d' }}>
          Wallet not initialized. Please import or create a wallet first.
        </p>
      </div>
    );
  }
  
  return (
    <div style={{
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginTop: '15px'
    }}>
      <h3 style={{ 
        color: '#495057', 
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <span style={{ 
          display: 'inline-block', 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%', 
          backgroundColor: '#FF6600',
          color: 'white',
          textAlign: 'center',
          lineHeight: '24px',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          ₿
        </span>
        Monero Wallet
      </h3>
      
      {/* Address Section */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ fontSize: '14px', color: '#495057', marginBottom: '5px' }}>Your Address:</h4>
        {address.loading ? (
          <div style={{ textAlign: 'center', padding: '10px' }}>Loading...</div>
        ) : address.error ? (
          <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>{address.error}</div>
        ) : (
          <div style={{ 
            backgroundColor: '#e9ecef', 
            padding: '8px', 
            borderRadius: '4px',
            fontSize: '12px',
            wordBreak: 'break-all',
            position: 'relative'
          }}>
            {address.address}
            <button
              onClick={() => copyToClipboard(address.address)}
              style={{
                position: 'absolute',
                right: '5px',
                top: '5px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
        )}
      </div>
      
      {/* Balance Section */}
      <div style={{ 
        marginBottom: '15px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <div>
          <h4 style={{ fontSize: '14px', color: '#495057', marginBottom: '5px' }}>Balance:</h4>
          {balance.loading ? (
            <div>Loading...</div>
          ) : balance.error ? (
            <div style={{ color: '#dc3545', fontSize: '12px' }}>{balance.error}</div>
          ) : (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#343a40' }}>
                {formatMoneroAmount(balance.total)}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Unlocked: {formatMoneroAmount(balance.unlocked)}
              </div>
            </div>
          )}
        </div>
        
        <div>
          <button
            onClick={loadMoneroBalance}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* Sync Status */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '5px'
        }}>
          <h4 style={{ fontSize: '14px', color: '#495057', margin: 0 }}>Sync Status:</h4>
          <button
            onClick={startSync}
            disabled={isSyncing}
            style={{
              backgroundColor: isSyncing ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              fontSize: '12px',
              cursor: isSyncing ? 'not-allowed' : 'pointer'
            }}
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
        
        {isSyncing && (
          <div>
            <div style={{ 
              height: '6px', 
              backgroundColor: '#e9ecef',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                height: '100%', 
                width: `${syncStatus.percentDone}%`,
                backgroundColor: '#28a745',
                borderRadius: '3px'
              }} />
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
              {syncStatus.percentDone.toFixed(2)}% - {syncStatus.message}
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div style={{ 
        display: 'flex',
        gap: '10px',
        marginBottom: '15px'
      }}>
        <button
          onClick={() => setShowSendForm(!showSendForm)}
          style={{
            flex: 1,
            backgroundColor: '#FF6600',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {showSendForm ? 'Cancel' : 'Send XMR'}
        </button>
        
        <button
          onClick={() => setShowSubaddressForm(!showSubaddressForm)}
          style={{
            flex: 1,
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {showSubaddressForm ? 'Cancel' : 'New Address'}
        </button>
      </div>
      
      {/* Send Form */}
      {showSendForm && (
        <div style={{ 
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px'
        }}>
          <h4 style={{ fontSize: '14px', color: '#495057', marginBottom: '10px' }}>Send Monero</h4>
          
          <form onSubmit={sendTransaction}>
            <div style={{ marginBottom: '10px' }}>
              <label 
                htmlFor="recipient-address" 
                style={{ display: 'block', fontSize: '12px', color: '#495057', marginBottom: '3px' }}
              >
                Recipient Address:
              </label>
              <input
                id="recipient-address"
                type="text"
                value={transaction.address}
                onChange={(e) => setTransaction(prev => ({ ...prev, address: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label 
                htmlFor="amount" 
                style={{ display: 'block', fontSize: '12px', color: '#495057', marginBottom: '3px' }}
              >
                Amount (XMR):
              </label>
              <input
                id="amount"
                type="number"
                step="0.000001"
                min="0.000001"
                value={transaction.amount}
                onChange={(e) => setTransaction(prev => ({ ...prev, amount: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label 
                htmlFor="payment-id" 
                style={{ display: 'block', fontSize: '12px', color: '#495057', marginBottom: '3px' }}
              >
                Payment ID (optional):
              </label>
              <input
                id="payment-id"
                type="text"
                value={transaction.paymentId}
                onChange={(e) => setTransaction(prev => ({ ...prev, paymentId: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label 
                htmlFor="priority" 
                style={{ display: 'block', fontSize: '12px', color: '#495057', marginBottom: '3px' }}
              >
                Priority:
              </label>
              <select
                id="priority"
                value={transaction.priority}
                onChange={(e) => setTransaction(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
              >
                <option value={1}>Low</option>
                <option value={2}>Medium</option>
                <option value={3}>High</option>
                <option value={4}>Urgent</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={transaction.sending}
              style={{
                width: '100%',
                backgroundColor: transaction.sending ? '#6c757d' : '#FF6600',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '14px',
                cursor: transaction.sending ? 'not-allowed' : 'pointer'
              }}
            >
              {transaction.sending ? 'Sending...' : 'Send Transaction'}
            </button>
            
            {transaction.error && (
              <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '10px' }}>
                Error: {transaction.error}
              </div>
            )}
            
            {transaction.success && (
              <div style={{ color: '#28a745', fontSize: '12px', marginTop: '10px' }}>
                Transaction sent successfully!<br />
                TX Hash: {transaction.txHash}
              </div>
            )}
          </form>
        </div>
      )}
      
      {/* Subaddress Form */}
      {showSubaddressForm && (
        <div style={{ 
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px'
        }}>
          <h4 style={{ fontSize: '14px', color: '#495057', marginBottom: '10px' }}>Create New Subaddress</h4>
          
          <form onSubmit={createSubaddress}>
            <div style={{ marginBottom: '15px' }}>
              <label 
                htmlFor="label" 
                style={{ display: 'block', fontSize: '12px', color: '#495057', marginBottom: '3px' }}
              >
                Label (optional):
              </label>
              <input
                id="label"
                type="text"
                value={subaddress.label}
                onChange={(e) => setSubaddress(prev => ({ ...prev, label: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={subaddress.creating}
              style={{
                width: '100%',
                backgroundColor: subaddress.creating ? '#6c757d' : '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '14px',
                cursor: subaddress.creating ? 'not-allowed' : 'pointer'
              }}
            >
              {subaddress.creating ? 'Creating...' : 'Create Subaddress'}
            </button>
            
            {subaddress.error && (
              <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '10px' }}>
                Error: {subaddress.error}
              </div>
            )}
            
            {subaddress.address && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '12px', color: '#495057', marginBottom: '5px' }}>
                  New subaddress created:
                </div>
                <div style={{ 
                  backgroundColor: '#ffffff', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  position: 'relative'
                }}>
                  {subaddress.address}
                  <button
                    onClick={() => subaddress.address && copyToClipboard(subaddress.address)}
                    style={{
                      position: 'absolute',
                      right: '5px',
                      top: '5px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
      
      <div style={{ 
        fontSize: '12px', 
        color: '#6c757d', 
        textAlign: 'center',
        marginTop: '10px'
      }}>
        Powered by monero-ts
      </div>
    </div>
  );
};

export default MoneroWallet;

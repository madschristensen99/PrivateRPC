import React, { useState, useEffect } from 'react';
import { useMonero } from '../../context/MoneroContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { ErrorMessage } from '../common/ErrorMessage';
import { colors } from '../../styles/theme';

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

interface MoneroSubaddressState {
  label: string;
  creating: boolean;
  address: string | null;
  error: string | null;
}

export const MoneroWallet: React.FC = () => {
  const { moneroWalletInitialized } = useMonero();
  
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
  
  const [subaddress, setSubaddress] = useState<MoneroSubaddressState>({
    label: '',
    creating: false,
    address: null,
    error: null
  });

  // Load Monero wallet data on component mount
  useEffect(() => {
    if (moneroWalletInitialized) {
      loadMoneroAddress();
      loadMoneroBalance();
    }
  }, [moneroWalletInitialized]);

  // Load Monero address
  const loadMoneroAddress = async () => {
    setAddress(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await chrome.runtime.sendMessage({ type: 'getMoneroAddress' });
      if (response && !response.error) {
        setAddress({
          address: response.address,
          loading: false,
          error: null
        });
      } else {
        throw new Error(response?.error || 'Failed to load Monero address');
      }
    } catch (err: any) {
      console.error('Error loading Monero address:', err);
      setAddress(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load Monero address'
      }));
    }
  };

  // Load Monero balance
  const loadMoneroBalance = async () => {
    setBalance(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await chrome.runtime.sendMessage({ type: 'getMoneroBalance' });
      if (response && !response.error) {
        setBalance({
          total: response.balance || '0',
          unlocked: response.unlockedBalance || '0',
          loading: false,
          error: null
        });
      } else {
        throw new Error(response?.error || 'Failed to load Monero balance');
      }
    } catch (err: any) {
      console.error('Error loading Monero balance:', err);
      setBalance(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load Monero balance'
      }));
    }
  };

  // Create a new subaddress
  const createSubaddress = async () => {
    if (!subaddress.label.trim()) {
      setSubaddress(prev => ({
        ...prev,
        error: 'Please enter a label for the subaddress'
      }));
      return;
    }

    setSubaddress(prev => ({ ...prev, creating: true, error: null }));
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'createMoneroSubaddress',
        label: subaddress.label
      });
      
      if (response && !response.error) {
        setSubaddress({
          label: '',
          creating: false,
          address: response.address,
          error: null
        });
      } else {
        throw new Error(response?.error || 'Failed to create subaddress');
      }
    } catch (err: any) {
      console.error('Error creating Monero subaddress:', err);
      setSubaddress(prev => ({
        ...prev,
        creating: false,
        error: err.message || 'Failed to create subaddress'
      }));
    }
  };

  if (!moneroWalletInitialized) {
    return (
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', color: colors.monero.primary }}>
          Monero Wallet
        </h3>
        <div style={{ 
          padding: '15px',
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#aaa'
        }}>
          Monero wallet is not initialized yet.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ margin: '0 0 15px 0', color: colors.monero.primary }}>
        Monero Wallet
      </h3>
      
      <Card>
        {/* Monero Address */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <strong style={{ color: colors.text }}>Primary Address:</strong>
            <Button
              onClick={loadMoneroAddress}
              disabled={address.loading}
              variant="secondary"
              style={{ padding: '4px 8px', fontSize: '12px' }}
            >
              {address.loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
          
          <div style={{ 
            wordBreak: 'break-all',
            fontSize: '11px',
            fontFamily: 'monospace',
            backgroundColor: '#1a1a1a',
            padding: '6px',
            borderRadius: '3px',
            border: '1px solid #333',
            color: colors.monero.primary
          }}>
            {address.loading ? 'Loading...' : address.address || 'Not available'}
          </div>
          
          {address.error && <ErrorMessage message={address.error} />}
        </div>
        
        {/* Monero Balance */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <strong style={{ color: colors.text }}>Balance:</strong>
            <Button
              onClick={loadMoneroBalance}
              disabled={balance.loading}
              variant="secondary"
              style={{ padding: '4px 8px', fontSize: '12px' }}
            >
              {balance.loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
          
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#1a1a1a',
            padding: '8px',
            borderRadius: '3px',
            fontSize: '13px',
            border: '1px solid #333',
            color: colors.text
          }}>
            <div>
              <div>Total: <strong>{balance.loading ? 'Loading...' : `${balance.total} XMR`}</strong></div>
              <div>Unlocked: <strong>{balance.loading ? 'Loading...' : `${balance.unlocked} XMR`}</strong></div>
            </div>
          </div>
          
          {balance.error && <ErrorMessage message={balance.error} />}
        </div>
        
        {/* Create Subaddress */}
        <div>
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ color: colors.text }}>Create Subaddress:</strong>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              value={subaddress.label}
              onChange={(e) => setSubaddress(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Subaddress Label"
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #333',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#1a1a1a',
                color: colors.text
              }}
            />
            <Button
              onClick={createSubaddress}
              disabled={subaddress.creating || !subaddress.label.trim()}
              variant="primary"
            >
              {subaddress.creating ? 'Creating...' : 'Create'}
            </Button>
          </div>
          
          {subaddress.error && <ErrorMessage message={subaddress.error} />}
          
          {subaddress.address && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '12px', color: colors.text, marginBottom: '5px' }}>
                New Subaddress:
              </div>
              <div style={{ 
                wordBreak: 'break-all',
                fontSize: '11px',
                fontFamily: 'monospace',
                backgroundColor: '#1a1a1a',
                padding: '6px',
                borderRadius: '3px',
                border: '1px solid #333',
                color: colors.monero.primary
              }}>
                {subaddress.address}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

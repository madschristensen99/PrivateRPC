import React from 'react';
import { useMonero } from '../../context/MoneroContext';
import { Button } from '../common/Button';
import { ErrorMessage } from '../common/ErrorMessage';
import { colors } from '../../styles/theme';

export const MoneroTransfer: React.FC = () => {
  const { 
    transferState, 
    paymentForm, 
    setPaymentForm, 
    resetTransfer, 
    executeMoneroTransfer 
  } = useMonero();
  
  const isFormValid = 
    paymentForm.destinationAddress.trim().length > 0 && 
    paymentForm.amount.trim().length > 0 &&
    !isNaN(parseFloat(paymentForm.amount)) &&
    parseFloat(paymentForm.amount) > 0;
  
  const isTransferInProgress = transferState.status === 'in-progress';
  const isTransferCompleted = transferState.status === 'completed';
  const isTransferError = transferState.status === 'error';
  const isTransferIdle = transferState.status === 'idle';

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ margin: '0 0 15px 0', color: colors.monero.primary }}>
        Monero Transfer
      </h3>
      
      {isTransferIdle && (
        <div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              color: '#FFFFFF', 
              fontWeight: 'bold' 
            }}>
              Destination Address:
            </label>
            <input
              type="text"
              value={paymentForm.destinationAddress}
              onChange={(e) => setPaymentForm({
                ...paymentForm,
                destinationAddress: e.target.value
              })}
              placeholder="Enter Monero address"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              color: '#FFFFFF', 
              fontWeight: 'bold' 
            }}>
              Amount (XMR):
            </label>
            <input
              type="text"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({
                ...paymentForm,
                amount: e.target.value
              })}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <Button
            onClick={executeMoneroTransfer}
            disabled={!isFormValid}
            fullWidth
          >
            Send XMR
          </Button>
        </div>
      )}
      
      {(isTransferInProgress || isTransferCompleted || isTransferError) && (
        <div>
          <div style={{ 
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: isTransferError ? '#ffebee' : 
                            isTransferCompleted ? '#e8f5e9' : '#e3f2fd',
            border: `1px solid ${isTransferError ? '#ffcdd2' : 
                              isTransferCompleted ? '#c8e6c9' : '#bbdefb'}`,
            borderRadius: '4px'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: isTransferError ? '#c62828' : 
                    isTransferCompleted ? '#2e7d32' : '#1565c0',
              marginBottom: '10px'
            }}>
              {isTransferError ? 'Transfer Failed' : 
               isTransferCompleted ? 'Transfer Completed' : 
               `Transfer in Progress: ${transferState.step}`}
            </div>
            
            {transferState.txHash && (
              <div style={{ marginBottom: '10px' }}>
                <strong>Transaction Hash:</strong>
                <div style={{ 
                  wordBreak: 'break-all',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  backgroundColor: '#f5f5f5',
                  padding: '6px',
                  borderRadius: '3px',
                  marginTop: '5px'
                }}>
                  {transferState.txHash}
                </div>
              </div>
            )}
            
            <div style={{ 
              maxHeight: '100px',
              overflowY: 'auto',
              marginTop: '10px',
              backgroundColor: '#f5f5f5',
              padding: '8px',
              borderRadius: '3px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              {transferState.logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  {log}
                </div>
              ))}
            </div>
            
            {transferState.error && (
              <ErrorMessage message={transferState.error} style={{ marginTop: '10px' }} />
            )}
          </div>
          
          <Button
            onClick={resetTransfer}
            variant="secondary"
            fullWidth
          >
            {isTransferCompleted || isTransferError ? 'New Transfer' : 'Cancel'}
          </Button>
        </div>
      )}
    </div>
  );
};

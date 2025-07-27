import React from 'react';
import { AppProvider } from './context/AppContext';
import { useWallet } from './context/WalletContext';
import { useMonero } from './context/MoneroContext';
import { Layout } from './components/layout/Layout';
import { WalletImport } from './components/wallet/WalletImport';
import { WalletInfo } from './components/wallet/WalletInfo';
import { MoneroWallet } from './components/monero/MoneroWallet';
import { MoneroTransfer } from './components/monero/MoneroTransfer';
import { PendingTransactions } from './components/transactions/PendingTransactions';
import { TransactionProgress } from './components/transactions/TransactionProgress';

// Main application content component
const AppContent: React.FC = () => {
  const { walletInfo } = useWallet();
  const { moneroWalletInitialized } = useMonero();

  return (
    <Layout>
      {!walletInfo ? (
        <WalletImport />
      ) : (
        <>
          <WalletInfo />
          <MoneroWallet />
          <MoneroTransfer />
          <PendingTransactions />
          <TransactionProgress />
        </>
      )}
    </Layout>
  );
};

// Root App component
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

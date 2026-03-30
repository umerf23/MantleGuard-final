import { useState, useEffect } from 'react';
import { 
  connectWallet, 
  switchToMantle, 
  isMantle, 
  shortenAddress 
} from '../lib/web3';

// Safe helper functions
const isWalletAvailable = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
};

const subscribeToWalletEvents = (
  onAccountChange: (account: string | null) => void,
  onChainChange: (chainId: string) => void
) => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return () => {};
  }

  const handleAccountsChanged = (accounts: string[]) => {
    onAccountChange(accounts.length > 0 ? accounts[0] : null);
  };

  const handleChainChanged = (chainId: string) => {
    onChainChange(chainId);
  };

  window.ethereum.on('accountsChanged', handleAccountsChanged);
  window.ethereum.on('chainChanged', handleChainChanged);

  return () => {
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
  };
};

export const useWallet = () => {
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMantleNetwork, setIsMantleNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const walletAvailable = isWalletAvailable();

  useEffect(() => {
    if (!walletAvailable) return;

    const unsubscribe = subscribeToWalletEvents(
      (newAccount) => {
        setAccount(newAccount || '');
        setIsConnected(!!newAccount);
      },
      (chainId) => {
        setIsMantleNetwork(isMantle(chainId));
      }
    );

    // Check if already connected
    const checkConnection = async () => {
      try {
        const connectedAccount = await connectWallet();
        if (connectedAccount) {
          setAccount(connectedAccount);
          setIsConnected(true);
          setIsMantleNetwork(isMantle());
        }
      } catch (err) {
        console.error("Initial wallet check failed:", err);
      }
    };

    checkConnection();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [walletAvailable]);

  const connect = async () => {
    if (!walletAvailable) {
      setError("MetaMask is not installed. Please install it to continue.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const address = await connectWallet();
      if (address) {
        setAccount(address);
        setIsConnected(true);
        setIsMantleNetwork(isMantle());
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const switchNetwork = async () => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await switchToMantle();
      setIsMantleNetwork(true);
    } catch (err: any) {
      setError(err.message || "Failed to switch to Mantle network");
    } finally {
      setLoading(false);
    }
  };

  return {
    account,
    isConnected,
    isMantleNetwork,
    loading,
    error,
    walletAvailable,
    connect,
    switchNetwork,
    shortenAddress: () => shortenAddress(account),
  };
};

import { useState, useEffect, useCallback } from 'react';
import {
  connectWallet,
  getConnectedAccount,
  getCurrentChainId,
  switchToMantle,
  isMantle,
  isWalletAvailable,
  shortenAddress,
} from '../lib/web3';

const subscribeToWalletEvents = (
  onAccountChange: (account: string | null) => void,
  onChainChange: (chainId: string) => void
) => {
  if (typeof window === 'undefined' || !window.ethereum) return () => {};

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

  // Sync state from an account + chainId pair
  const syncState = useCallback((addr: string | null, chainId: string | null) => {
    setAccount(addr ?? '');
    setIsConnected(!!addr);
    setIsMantleNetwork(isMantle(chainId ?? undefined));
  }, []);

  useEffect(() => {
    if (!walletAvailable) return;

    // Silently check existing connection — no popup
    const checkConnection = async () => {
      const addr = await getConnectedAccount();
      const chainId = getCurrentChainId();
      syncState(addr, chainId);
    };

    checkConnection();

    const unsubscribe = subscribeToWalletEvents(
      (newAccount) => {
        const chainId = getCurrentChainId();
        syncState(newAccount, chainId);
      },
      (chainId) => {
        setIsMantleNetwork(isMantle(chainId));
      }
    );

    return unsubscribe;
  }, [walletAvailable, syncState]);

  const connect = async () => {
    if (!walletAvailable) {
      setError('MetaMask is not installed. Please install it to continue.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const address = await connectWallet();
      const chainId = getCurrentChainId();
      syncState(address, chainId);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const switchNetwork = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await switchToMantle();
      // chainChanged event will fire and update isMantleNetwork automatically
    } catch (err: any) {
      setError(err.message || 'Failed to switch to Mantle network');
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

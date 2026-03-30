import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const MANTLE_CHAIN_ID = '0x1388';
const MANTLE_RPC = 'https://rpc.mantle.xyz';

// Detect if MetaMask is available (better detection)
const getProvider = () => {
  if (typeof window === 'undefined') return null;
  
  const { ethereum } = window;
  
  // Prefer MetaMask if available
  if (ethereum?.isMetaMask) {
    return ethereum;
  }
  
  // Fallback to any ethereum provider
  return ethereum;
};

export const isWalletAvailable = (): boolean => {
  return !!getProvider();
};

export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const isMantle = (chainId?: string): boolean => {
  if (!chainId) {
    chainId = getProvider()?.chainId;
  }
  return chainId?.toLowerCase() === MANTLE_CHAIN_ID.toLowerCase();
};

export const connectWallet = async (): Promise<string | null> => {
  const provider = getProvider();
  if (!provider) {
    throw new Error("No wallet detected. Please install MetaMask.");
  }

  try {
    const accounts = await provider.request({
      method: 'eth_requestAccounts',
    });
    return accounts[0] || null;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error("Connection request rejected by user.");
    }
    throw new Error(error.message || "Failed to connect wallet");
  }
};

export const switchToMantle = async (): Promise<void> => {
  const provider = getProvider();
  if (!provider) throw new Error("Wallet not available");

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MANTLE_CHAIN_ID }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      // Add network if not present
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: MANTLE_CHAIN_ID,
          chainName: 'Mantle Mainnet',
          nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
          rpcUrls: [MANTLE_RPC],
          blockExplorerUrls: ['https://explorer.mantle.xyz'],
        }],
      });
    } else {
      throw new Error(switchError.message || "Failed to switch network");
    }
  }
};

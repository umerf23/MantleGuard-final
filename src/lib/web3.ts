import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Mantle Mainnet Config
const MANTLE_CHAIN_ID = '0x1388'; // 5000 in hex
const MANTLE_RPC = 'https://rpc.mantle.xyz';

export const isWalletAvailable = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
};

export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const isMantle = (chainId?: string): boolean => {
  if (!chainId) {
    chainId = window.ethereum?.chainId;
  }
  return chainId?.toLowerCase() === MANTLE_CHAIN_ID.toLowerCase();
};

export const connectWallet = async (): Promise<string | null> => {
  if (!isWalletAvailable()) {
    throw new Error("MetaMask or compatible wallet not found. Please install MetaMask.");
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    return accounts[0] || null;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error("User rejected the connection request.");
    }
    throw new Error(error.message || "Failed to connect wallet");
  }
};

export const switchToMantle = async (): Promise<void> => {
  if (!isWalletAvailable()) {
    throw new Error("Wallet not available");
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MANTLE_CHAIN_ID }],
    });
  } catch (switchError: any) {
    // This error code means the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: MANTLE_CHAIN_ID,
            chainName: 'Mantle Mainnet',
            nativeCurrency: {
              name: 'MNT',
              symbol: 'MNT',
              decimals: 18,
            },
            rpcUrls: [MANTLE_RPC],
            blockExplorerUrls: ['https://explorer.mantle.xyz'],
          }],
        });
      } catch (addError) {
        throw new Error("Failed to add Mantle network");
      }
    } else {
      throw new Error(switchError.message || "Failed to switch to Mantle network");
    }
  }
};

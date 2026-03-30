import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const MANTLE_CHAIN_ID = '0x1388';
const MANTLE_RPC = 'https://rpc.mantle.xyz';

const getProvider = () => {
  if (typeof window === 'undefined') return null;
  const { ethereum } = window;
  if (ethereum?.isMetaMask) return ethereum;
  return ethereum ?? null;
};

export const isWalletAvailable = (): boolean => {
  return !!getProvider();
};

export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const isMantle = (chainId?: string): boolean => {
  const id = chainId ?? getProvider()?.chainId;
  if (!id) return false;
  return id.toLowerCase() === MANTLE_CHAIN_ID.toLowerCase();
};

// Silently checks if the wallet is already connected — no popup
export const getConnectedAccount = async (): Promise<string | null> => {
  const provider = getProvider();
  if (!provider) return null;
  try {
    const accounts: string[] = await provider.request({ method: 'eth_accounts' });
    return accounts[0] ?? null;
  } catch {
    return null;
  }
};

// Actively requests connection — triggers MetaMask popup
export const connectWallet = async (): Promise<string | null> => {
  const provider = getProvider();
  if (!provider) {
    throw new Error('No wallet detected. Please install MetaMask.');
  }
  try {
    const accounts: string[] = await provider.request({
      method: 'eth_requestAccounts',
    });
    return accounts[0] ?? null;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Connection request rejected by user.');
    }
    throw new Error(error.message || 'Failed to connect wallet');
  }
};

export const getCurrentChainId = (): string | null => {
  return getProvider()?.chainId ?? null;
};

export const switchToMantle = async (): Promise<void> => {
  const provider = getProvider();
  if (!provider) throw new Error('Wallet not available');
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MANTLE_CHAIN_ID }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
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
      throw new Error(switchError.message || 'Failed to switch network');
    }
  }
};

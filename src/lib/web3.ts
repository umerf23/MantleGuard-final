// src/lib/web3.ts
import { ethers } from 'ethers';

let discoveredProviders = new Map<string, any>();

// Listen for EIP-6963 provider announcements (runs once)
if (typeof window !== 'undefined') {
  window.addEventListener('eip6963:announceProvider', (event: any) => {
    const { info, provider } = event.detail;
    if (info && provider) {
      discoveredProviders.set(info.rdns, provider);
      console.log(`[EIP-6963] Detected wallet: ${info.name} (${info.rdns})`);
    }
  });

  // Request all providers to announce themselves
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}

export const getProvider = (preferredRdns = 'io.metamask'): any => {
  if (typeof window === 'undefined') return null;

  // 1. Try EIP-6963 first (best for multi-wallet support)
  if (discoveredProviders.size > 0) {
    // Prefer MetaMask
    if (discoveredProviders.has(preferredRdns)) {
      return discoveredProviders.get(preferredRdns);
    }
    // Fallback to first available provider
    return Array.from(discoveredProviders.values())[0];
  }

  // 2. Legacy fallback
  const { ethereum } = window as any;
  if (!ethereum) return null;

  // Prefer MetaMask if available
  if (ethereum.isMetaMask) return ethereum;

  // If it's an array (some extensions do this), try to find MetaMask
  if (Array.isArray(ethereum)) {
    return ethereum.find((p: any) => p?.isMetaMask) || ethereum[0];
  }

  return ethereum;
};

export const connectWallet = async (): Promise<{
  address: string;
  provider: ethers.BrowserProvider;
  signer: ethers.Signer;
} | null> => {
  try {
    const providerInstance = getProvider('io.metamask');

    if (!providerInstance) {
      throw new Error("No wallet provider detected. Please install MetaMask or another wallet.");
    }

    // Request account access
    await providerInstance.request({ method: 'eth_requestAccounts' });

    const ethersProvider = new ethers.BrowserProvider(providerInstance);
    const signer = await ethersProvider.getSigner();
    const address = await signer.getAddress();

    // Auto switch to Mantle Mainnet
    try {
      await providerInstance.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1388' }], // 5000 in hex
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Chain not added → add it
        await providerInstance.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x1388',
            chainName: 'Mantle',
            rpcUrls: ['https://rpc.mantle.xyz'],
            nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
            blockExplorerUrls: ['https://explorer.mantle.xyz'],
          }],
        });
      } else {
        throw switchError;
      }
    }

    return { address, provider: ethersProvider, signer };

  } catch (error: any) {
    console.error("Wallet connection error:", error);
    throw error;
  }
};

export const disconnectWallet = () => {
  // Nothing to do for most wallets, just clear local state
  console.log("Wallet disconnected");
};

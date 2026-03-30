import { useState } from 'react';
import { ethers } from 'ethers';

interface WalletOption {
  name: string;
  icon: string;
  key?: string; // for special detection
}

const walletOptions: WalletOption[] = [
  { name: 'MetaMask', icon: '🦊' },
  { name: 'Rainbow', icon: '🌈' },
  { name: 'WalletConnect', icon: '🔗' },
  { name: 'Phantom', icon: '👻', key: 'phantom' },
  { name: 'Coinbase Wallet', icon: '💰' },
  { name: 'Trust Wallet', icon: '🛡️', key: 'trustwallet' },
  { name: 'HaHa Wallet', icon: '😄' },
  { name: 'Browser Wallet', icon: '🌐' },
];

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (address: string, provider: ethers.BrowserProvider, signer: ethers.Signer) => void;
}

export default function WalletModal({ isOpen, onClose, onConnected }: WalletModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const connectWallet = async (walletName: string) => {
    setLoading(walletName);
    setError('');

    try {
      let provider: any;

      // Special detection for some wallets
      if (walletName === 'Phantom' && (window as any).phantom?.ethereum) {
        provider = (window as any).phantom.ethereum;
      } else if (walletName === 'Trust Wallet' && (window as any).trustwallet) {
        provider = (window as any).trustwallet;
      } else if (walletName === 'Rainbow' && (window as any).rainbow) {
        provider = (window as any).rainbow;
      } else {
        // Default fallback - most wallets inject into window.ethereum
        if (!(window as any).ethereum) {
          throw new Error('No wallet detected. Please install a wallet like MetaMask.');
        }
        provider = (window as any).ethereum;
      }

      // Request accounts
      await provider.request({ method: 'eth_requestAccounts' });

      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();

      // Auto-switch / Add Mantle Mainnet
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1388' }], // 5000 in hex
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) { // chain not added
          await provider.request({
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

      // Success - pass data back to parent
      onConnected(address, ethersProvider, signer);
      onClose();

    } catch (err: any) {
      console.error(err);
      setError(err.message || `Failed to connect to ${walletName}. Please try again.`);
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row">
          
          {/* Left: Wallet List */}
          <div className="w-full md:w-1/2 p-8 border-b md:border-r border-gray-200 dark:border-zinc-700">
            <h2 className="text-2xl font-semibold mb-6">Connect a Wallet</h2>
            
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => connectWallet(wallet.name)}
                  disabled={!!loading}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-2xl transition-all text-left disabled:opacity-70"
                >
                  <div className="text-3xl flex-shrink-0">{wallet.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{wallet.name}</div>
                    <div className="text-xs text-gray-500">Recommended</div>
                  </div>
                  {loading === wallet.name && (
                    <div className="animate-spin text-xl">⟳</div>
                  )}
                </button>
              ))}
            </div>

            {error && (
              <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
            )}
          </div>

          {/* Right: Explanation (like your screenshot) */}
          <div className="w-full md:w-1/2 p-8 bg-gray-50 dark:bg-zinc-950 flex flex-col">
            <div className="flex justify-end">
              <button 
                onClick={onClose} 
                className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-8">What is a Wallet?</h3>
            
            <div className="space-y-10 flex-1">
              <div>
                <div className="text-5xl mb-4">🏠</div>
                <h4 className="font-medium text-lg mb-2">A Home for your Digital Assets</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Wallets are used to send, receive, store, and display digital assets like MNT and NFTs on Mantle.
                </p>
              </div>

              <div>
                <div className="text-5xl mb-4">🔑</div>
                <h4 className="font-medium text-lg mb-2">A New Way to Log In</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Instead of creating new accounts and passwords, just connect your wallet to MantleGuard.
                </p>
              </div>
            </div>

            <a 
              href="https://mantle.xyz" 
              target="_blank" 
              className="text-blue-600 hover:underline text-sm mt-auto pt-6"
            >
              Learn more about Mantle Wallets →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

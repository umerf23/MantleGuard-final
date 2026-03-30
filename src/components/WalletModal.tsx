// src/components/WalletModal.tsx
import { useState } from 'react';
import { ethers } from 'ethers';

const walletOptions = [
  { name: 'MetaMask', icon: '🦊', rdns: 'io.metamask' },
  { name: 'Phantom', icon: '👻', rdns: 'app.phantom' },
  { name: 'Rainbow', icon: '🌈', rdns: 'me.rainbow' },
  { name: 'Coinbase Wallet', icon: '💰', rdns: 'com.coinbase.wallet' },
  { name: 'Trust Wallet', icon: '🛡️' },
  { name: 'Razor Wallet', icon: '🪒' },   // since you mentioned Razor
  { name: 'Browser Wallet', icon: '🌐' },
];

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (address: string, provider: ethers.BrowserProvider, signer: ethers.Signer) => void;
}

export default function WalletModal({ isOpen, onClose, onConnected }: WalletModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const connect = async (walletName: string, rdns?: string) => {
    setLoading(walletName);
    setError('');

    try {
      let providerInstance: any = null;

      // Try EIP-6963 first (modern standard)
      if ((window as any).ethereum?.providers) {
        providerInstance = (window as any).ethereum.providers.find((p: any) => 
          (rdns && p[rdns]) || p.isMetaMask
        );
      }

      if (!providerInstance) {
        providerInstance = (window as any).ethereum;
      }

      if (!providerInstance || typeof providerInstance.request !== 'function') {
        throw new Error("No valid wallet detected. Please make sure MetaMask is installed and enabled.");
      }

      // Request accounts
      const accounts = await providerInstance.request({ 
        method: 'eth_requestAccounts' 
      });

      const ethersProvider = new ethers.BrowserProvider(providerInstance);
      const signer = await ethersProvider.getSigner();
      const address = accounts[0];

      // Switch to Mantle Mainnet safely
      try {
        await providerInstance.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1388' }],
        });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
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
        }
      }

      onConnected(address, ethersProvider, signer);
      onClose();

    } catch (err: any) {
      console.error(err);
      let msg = err.message || "Connection failed";

      if (msg.includes("Unexpected error") || msg.includes("evmAsk")) {
        msg = "Phantom Wallet (or another extension) is causing conflict.\n\nPlease disable Phantom Wallet extension temporarily and try again with MetaMask.";
      }

      setError(msg);
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Wallet List */}
          <div className="w-full md:w-1/2 p-8 border-b md:border-r border-gray-200 dark:border-zinc-700">
            <h2 className="text-2xl font-semibold mb-6">Connect a Wallet</h2>
            
            <div className="space-y-3">
              {walletOptions.map((w) => (
                <button
                  key={w.name}
                  onClick={() => connect(w.name, w.rdns)}
                  disabled={!!loading}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-2xl text-left disabled:opacity-60"
                >
                  <span className="text-3xl">{w.icon}</span>
                  <div>
                    <div className="font-medium">{w.name}</div>
                    <div className="text-xs text-gray-500">Click to connect</div>
                  </div>
                  {loading === w.name && <span className="ml-auto animate-spin">⟳</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Info Side */}
          <div className="w-full md:w-1/2 p-8 bg-gray-50 dark:bg-zinc-950">
            <button onClick={onClose} className="float-right text-2xl text-gray-400">✕</button>
            
            <h3 className="text-xl font-semibold mt-8 mb-6">What is a Wallet?</h3>
            
            <div className="space-y-8">
              <div>
                <div className="text-4xl mb-3">🏠</div>
                <h4 className="font-medium">A Home for Digital Assets</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Used to store MNT and interact with Mantle dApps.
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">🔑</div>
                <h4 className="font-medium">Secure Login</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  No passwords — just connect your wallet.
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm border-t">
            {error.split('\n').map((line, i) => <p key={i}>{line}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}

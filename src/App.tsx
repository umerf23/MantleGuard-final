import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Audit from "@/pages/Audit";

import { useState } from 'react';
import WalletModal from './components/WalletModal';   // adjust path if needed
import { ethers } from 'ethers';

// Create queryClient once
const queryClient = new QueryClient();

function App() {
  // Global wallet state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const handleConnected = (
    address: string, 
    newProvider: ethers.BrowserProvider, 
    newSigner: ethers.Signer
  ) => {
    setAccount(address);
    setProvider(newProvider);
    setSigner(newSigner);
    // Optional: show success toast
    // toast.success(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
  };

  const disconnectWallet = () => {
    setAccount('');
    setProvider(null);
    setSigner(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          
          {/* Pass wallet state and functions to all pages */}
          <Switch>
            <Route path="/">
              <Home 
                account={account}
                signer={signer}
                onConnect={() => setIsModalOpen(true)}
                onDisconnect={disconnectWallet}
              />
            </Route>

            <Route path="/audit">
              <Audit 
                account={account}
                signer={signer}
                onConnect={() => setIsModalOpen(true)}
                onDisconnect={disconnectWallet}
              />
            </Route>

            <Route component={NotFound} />
          </Switch>

        </WouterRouter>

        {/* Wallet Modal - Rendered at app level so it's available everywhere */}
        <WalletModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConnected={handleConnected}
        />

        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

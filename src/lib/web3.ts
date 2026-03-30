export const connectWallet = async () => {
  try {
    // First, try to get a clean provider
    let providerInstance = getProvider();   // your existing getProvider function

    if (!providerInstance) {
      throw new Error("No wallet found. Please install MetaMask.");
    }

    // Important: Check if this provider is actually usable
    if (typeof providerInstance.request !== 'function') {
      throw new Error("Invalid provider detected. Try disabling crypto extensions.");
    }

    // Request accounts
    const accounts = await providerInstance.request({ 
      method: 'eth_requestAccounts' 
    });

    const ethersProvider = new ethers.BrowserProvider(providerInstance);
    const signer = await ethersProvider.getSigner();
    const address = accounts[0] || await signer.getAddress();

    // Switch to Mantle
    try {
      await providerInstance.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1388' }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
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
        console.warn("Could not switch network:", switchError);
      }
    }

    return { address, provider: ethersProvider, signer };

  } catch (error: any) {
    console.error("Connection failed:", error);

    // Better user-friendly error messages
    if (error.message?.includes("Unexpected error") || error.message?.includes("evmAsk")) {
      throw new Error("Wallet connection failed due to a browser extension conflict.\n\nPlease disable any crypto portfolio tracker extensions and try again.");
    }

    if (error.code === 4001) {
      throw new Error("Connection rejected by user.");
    }

    throw new Error(error.message || "Failed to connect wallet. Please try again.");
  }
};

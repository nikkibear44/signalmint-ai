import { createContext, useContext, useState, useCallback } from "react";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null); // Solana address (Phantom)
  const [evmAddress, setEvmAddress] = useState(null); // EVM address (OKX Wallet)
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const connect = useCallback(async () => {
    setError("");

    const provider = window?.phantom?.solana ?? window?.solana;

    if (!provider || !provider.isPhantom) {
      setError(
        "Phantom Wallet not detected. Install the Phantom browser extension."
      );
      return;
    }

    setConnecting(true);

    try {
      const result = await provider.connect();
      const publicKey = result?.publicKey?.toString();

      if (publicKey) {
        setAddress(publicKey);
      }
    } catch (err) {
      console.error(err);
      setError("Connection request was rejected or failed.");
    }

    setConnecting(false);
  }, []);

  const connectEvm = useCallback(async () => {
    setError("");

    const provider = window?.okxwallet;

    if (!provider) {
      setError(
        "OKX Wallet not detected. Install the OKX Wallet browser extension."
      );
      return;
    }

    setConnecting(true);

    try {
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        setEvmAddress(accounts[0]);
      }
    } catch (err) {
      console.error(err);
      setError("EVM connection request was rejected or failed.");
    }

    setConnecting(false);
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const provider = window?.phantom?.solana ?? window?.solana;
      if (provider?.disconnect) {
        await provider.disconnect();
      }
    } catch (err) {
      console.error(err);
    }

    setAddress(null);
  }, []);

  const disconnectEvm = useCallback(() => {
    // OKX Wallet's EVM provider has no explicit disconnect method;
    // we just clear local state.
    setEvmAddress(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        evmAddress,
        connecting,
        error,
        connect,
        disconnect,
        connectEvm,
        disconnectEvm,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);

  if (!ctx) {
    throw new Error("useWallet must be used within a WalletProvider");
  }

  return ctx;
}

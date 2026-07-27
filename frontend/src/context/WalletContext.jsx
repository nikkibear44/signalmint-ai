import { createContext, useContext, useState, useCallback } from "react";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const connect = useCallback(async () => {
    setError("");

    const provider = window?.okxwallet?.solana;

    if (!provider) {
      setError(
        "OKX Wallet not detected. Install the OKX Wallet browser extension."
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

  const disconnect = useCallback(async () => {
    try {
      const provider = window?.okxwallet?.solana;
      if (provider?.disconnect) {
        await provider.disconnect();
      }
    } catch (err) {
      console.error(err);
    }

    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{ address, connecting, error, connect, disconnect }}
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

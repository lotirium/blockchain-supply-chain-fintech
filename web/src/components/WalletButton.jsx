import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const WalletButton = ({ onConnect }) => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if user has a wallet address
    if (user?.walletAddress) {
      setConnected(true);
      if (onConnect) {
        onConnect(user.walletAddress);
      }
    }
  }, [user, onConnect]);

  const createWallet = async () => {
    try {
      setConnecting(true);
      setError(null);

      // Call backend to create/get wallet
      const response = await fetch('/api/blockchain/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create wallet');
      }

      const data = await response.json();
      if (data.walletAddress) {
        setConnected(true);
        if (onConnect) {
          onConnect(data.walletAddress);
        }
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
      setError(error.message || 'Failed to create wallet');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div>
      {!connected ? (
        <button
          onClick={createWallet}
          disabled={connecting}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            connecting
              ? 'bg-gray-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors duration-200`}
        >
          {connecting ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Creating Wallet...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>Create Wallet</span>
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-100 text-green-800">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Wallet Ready: {user?.walletAddress?.slice(0, 6)}...{user?.walletAddress?.slice(-4)}</span>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default WalletButton;
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { getProfile } from '../store/slices/authSlice';

const WalletButton = ({ onConnect }) => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if we just created the wallet
    const justCreated = localStorage.getItem('walletCreated');
    
    // Only update if we have a wallet address
    if (user && user.wallet_address) {
      setConnected(true);
      fetchBalance(user.wallet_address);
      if (onConnect) {
        onConnect(user.wallet_address);
      }
      
      // Set success message if wallet was just created
      if (justCreated === 'true') {
        setSuccessMessage(`Wallet created successfully! Address: ${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`);
        localStorage.removeItem('walletCreated');
      }
    } else {
      setConnected(false);
      setBalance(null);
      setSuccessMessage(null);
    }
    
  }, [user, onConnect]);

  const fetchBalance = async (address) => {
    try {
      const response = await fetch('/api/blockchain/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch balance');
      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const createWallet = async () => {
    try {
      setConnecting(true);
      setSuccessMessage(null);
      setError(null);

      const response = await fetch('/api/blockchain/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create wallet');
      }

      const data = await response.json();

      if (!data?.walletAddress) {
        throw new Error('No wallet address returned from server');
      }
      
      // Store the wallet data
      const walletData = {
        address: data.walletAddress,
        balance: data.balance || '0.0'
      };

      // Force a fresh profile fetch and wait for it to complete
      await dispatch(getProfile()).unwrap();

      // Set all states after profile is updated
      setSuccessMessage(`Wallet created successfully! Address: ${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}`);
      setBalance(data.balance || '0.0');
      setConnected(true);
      localStorage.setItem('walletCreated', 'true');
      
      try {
        await fetchBalance(data.walletAddress);
      } catch (error) {
        console.warn('Failed to fetch initial balance:', error);
      }

      if (onConnect) {
        onConnect(data.walletAddress);
      }

    } catch (error) {
      console.error('Failed to create wallet:', error);
      setError(error.message || 'Failed to create wallet');
    } finally {
      setConnecting(false);
    }
  };

  const renderCreateButton = () => (
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
        <span className="flex items-center">
          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Creating Wallet...</span>
        </span>
      ) : (
        <span className="flex items-center">
          <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span>Create Wallet</span>
        </span>
      )}
    </button>
  );

  const renderConnectedWallet = () => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          {successMessage ? (
            <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          <span className="font-medium">Wallet Connected</span>
        </div>
        {successMessage && (
          <div className="bg-green-50 border border-green-100 rounded p-3 mb-3">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}
        <p className="text-sm text-gray-600">
          Address: <span className="font-mono">{user?.wallet_address?.slice(0, 6)}...{user?.wallet_address?.slice(-4)}</span>
        </p>
        {balance !== null ? (
          <p className="text-sm text-gray-600">
            Balance: <span className="font-medium">{balance !== null ? parseFloat(balance).toFixed(4) : '0.0000'} ETH</span>
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <div>
      {!connected ? renderCreateButton() : renderConnectedWallet()}
      {error && <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100">{error}</div>}
    </div>
  );
};

export default WalletButton;
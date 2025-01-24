import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeBlockchain, selectBlockchainState, clearError, setError } from '../store/slices/blockchainSlice';
import NFTProvider from './NFTProvider';

const BlockchainProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { isInitialized, isConnected, error, account, network } = useSelector(selectBlockchainState);
  const [showMetaMaskPrompt, setShowMetaMaskPrompt] = useState(false);
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidNetwork, setIsValidNetwork] = useState(false);

  // Validate network
  useEffect(() => {
    const validateNetwork = async () => {
      if (!network?.chainId) return;

      const requiredChainId = import.meta.env.VITE_REQUIRED_CHAIN_ID;
      const isValid = network.chainId.toString() === requiredChainId;

      setIsValidNetwork(isValid);

      if (!isValid) {
        dispatch(setError(`Please switch to ${import.meta.env.VITE_REQUIRED_NETWORK_NAME || 'the correct network'}`));
      } else {
        dispatch(clearError());
      }
    };

    validateNetwork();
  }, [network, dispatch]);

  useEffect(() => {
    // Only check if MetaMask is installed, don't auto-initialize
    if (typeof window.ethereum === 'undefined') {
      setShowMetaMaskPrompt(true);
      setShowConnectPrompt(false);
    } else {
      setShowMetaMaskPrompt(false);
      // Only show connect prompt if not connected
      setShowConnectPrompt(!isConnected);
    }
  }, [isConnected]);

  // Handle MetaMask events
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = () => {
        if (isInitialized) {
          dispatch(initializeBlockchain());
        }
      };

      const handleChainChanged = () => {
        if (isInitialized) {
          window.location.reload();
        }
      };

      const handleDisconnect = () => {
        if (isInitialized) {
          window.location.reload();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [dispatch, isInitialized]);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      await dispatch(initializeBlockchain()).unwrap();
      setShowConnectPrompt(false);
    } catch (err) {
      console.error('Failed to connect to MetaMask:', err);
      dispatch(setError(err.message || 'Failed to connect to MetaMask'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      setIsLoading(true);
      const chainId = `0x${parseInt(import.meta.env.VITE_REQUIRED_CHAIN_ID).toString(16)}`;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });

      // Handle case where network doesn't exist
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${parseInt(import.meta.env.VITE_REQUIRED_CHAIN_ID).toString(16)}`,
              chainName: import.meta.env.VITE_REQUIRED_NETWORK_NAME,
              nativeCurrency: {
                name: import.meta.env.VITE_NETWORK_CURRENCY_NAME || 'Ether',
                symbol: import.meta.env.VITE_NETWORK_CURRENCY_SYMBOL || 'ETH',
                decimals: 18
              },
              rpcUrls: [import.meta.env.VITE_NETWORK_RPC_URL],
              blockExplorerUrls: [import.meta.env.VITE_NETWORK_EXPLORER_URL]
            }]
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
          dispatch(setError('Failed to add network. Please try manually.'));
        }
      } else {
        console.error('Failed to switch network:', switchError);
        dispatch(setError('Failed to switch network. Please try manually.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <>
      {/* MetaMask Installation Prompt */}
      {showMetaMaskPrompt && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  MetaMask is required to use blockchain features.
                </p>
              </div>
            </div>
            <div>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Install MetaMask
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {showConnectPrompt && !showMetaMaskPrompt && (
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Connect your wallet to access blockchain features. This is only required for cryptocurrency-related operations.
                </p>
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Network Warning */}
      {isConnected && !isValidNetwork && (
        <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  Please switch to {import.meta.env.VITE_REQUIRED_NETWORK_NAME || 'the correct network'} to use blockchain features.
                </p>
              </div>
            </div>
            <button
              onClick={handleSwitchNetwork}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Switch Network
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => dispatch(clearError())}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Info */}
      {isConnected && (
        <div className="bg-gray-100 p-2 text-sm text-gray-600 flex justify-end space-x-4 mb-4">
          <span>
            Account: {account?.slice(0, 6)}...{account?.slice(-4)}
          </span>
          <span>
            Network: {network?.name || 'Unknown'}
          </span>
        </div>
      )}

      {children}
    </>
  );

  // Only wrap with NFTProvider if connected and on correct network
  return isConnected && isValidNetwork ? (
    <NFTProvider>{content}</NFTProvider>
  ) : (
    content
  );
};

export default BlockchainProvider;
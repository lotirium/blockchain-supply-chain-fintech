import React, { useState, useEffect } from 'react';
import { blockchainService } from '../services/blockchain';
import ProductNFTTracker from '../components/blockchain/ProductNFTTracker';
import ProductStatusControls from '../components/blockchain/ProductStatusControls';
import TransactionMonitor from '../components/blockchain/TransactionMonitor';

// Network Status Component
const NetworkStatus = ({ networkDetails }) => (
  <div className="bg-white rounded-lg shadow p-4 mb-6">
    <h2 className="text-xl font-semibold mb-4">Network Status</h2>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-gray-600">Network</p>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${networkDetails?.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <p className="font-medium">{networkDetails?.name || 'Not Connected'}</p>
        </div>
      </div>
      <div>
        <p className="text-gray-600">Chain ID</p>
        <p className="font-medium">{networkDetails?.chainId || 'N/A'}</p>
      </div>
      <div>
        <p className="text-gray-600">Latest Block</p>
        <p className="font-medium">{networkDetails?.blockNumber || 'N/A'}</p>
      </div>
      <div>
        <p className="text-gray-600">Gas Price</p>
        <p className="font-medium">{networkDetails?.gasPrice === 'N/A' ? 'N/A' : `${networkDetails?.gasPrice} Gwei`}</p>
      </div>
    </div>
    {networkDetails?.contracts && (
      <div className="mt-4 border-t pt-4">
        <p className="text-gray-600 mb-2">Smart Contracts</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Product NFT</p>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${networkDetails.contracts.productNFT === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="font-medium">{networkDetails.contracts.productNFT}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Supply Chain</p>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${networkDetails.contracts.supplyChain === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="font-medium">{networkDetails.contracts.supplyChain}</p>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

// Contract Controls Component
const ContractControls = ({ isPaused, onPauseContract, onUnpauseContract }) => (
  <div className="bg-white rounded-lg shadow p-4 mb-6">
    <h2 className="text-xl font-semibold mb-4">Contract Controls</h2>
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-red-500' : 'bg-green-500'} mr-2`} />
        <span>{isPaused ? 'Paused' : 'Active'}</span>
      </div>
      <button
        onClick={isPaused ? onUnpauseContract : onPauseContract}
        className={`py-2 px-4 rounded-md ${
          isPaused
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        } text-white`}
      >
        {isPaused ? 'Unpause Contract' : 'Pause Contract'}
      </button>
    </div>
  </div>
);

// Main Dashboard Component 
const AdminBlockchainDashboard = () => {
  const [networkDetails, setNetworkDetails] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const initializeBlockchain = async () => {
      try {
        await blockchainService.initialize();
        const details = await blockchainService.getNetworkDetails();
        setNetworkDetails(details);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize blockchain:', error);
        let errorMessage = 'Failed to initialize blockchain connection. ';
        
        if (error.message.includes('Network connection timeout') || error.message.includes('Failed to connect')) {
            errorMessage += 'Could not connect to the blockchain node. Please ensure the node is running.';
        } else if (error.message.includes('contract')) {
            errorMessage += 'There was an issue with the smart contracts. Please check the contract configuration.';
        } else if (error.message.includes('configuration')) {
            errorMessage += 'There was an issue with the blockchain configuration. Please check your environment settings.';
        } else {
            errorMessage += error.message;
        }
        
        setError(errorMessage);
      }
    };

    initializeBlockchain();
  }, []);

  const handlePauseContract = async () => {
    try {
      await blockchainService.pauseContract();
      setIsPaused(true);
    } catch (error) {
      console.error('Failed to pause contract:', error);
    }
  };

  const handleUnpauseContract = async () => {
    try {
      await blockchainService.unpauseContract();
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to unpause contract:', error);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (selectedProduct) {
      try {
        await blockchainService.updateProductStatus(selectedProduct.id, status);
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="text-center">
          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              <p className="mt-2 text-sm">
                Please make sure:
                <ul className="list-disc list-inside mt-1">
                  <li>The blockchain node is running on the correct port</li>
                  <li>The server is properly configured with contract addresses</li>
                  <li>The network is accessible and responding</li>
                  <li>All required environment variables are set correctly</li>
                </ul>
              </p>
            </div>
          ) : (
            <p className="text-xl">Connecting to blockchain...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Blockchain Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <NetworkStatus networkDetails={networkDetails} />
          </div>
          <div>
            <ContractControls
              isPaused={isPaused}
              onPauseContract={handlePauseContract}
              onUnpauseContract={handleUnpauseContract}
            />
            <TransactionMonitor />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ProductNFTTracker onProductSelect={setSelectedProduct} />
          {selectedProduct && (
            <ProductStatusControls
              productId={selectedProduct.id}
              currentStatus={selectedProduct.status}
              onStatusUpdate={handleStatusUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBlockchainDashboard;
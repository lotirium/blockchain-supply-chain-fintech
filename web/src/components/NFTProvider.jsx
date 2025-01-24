import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ethers } from 'ethers';
import ipfsService from '../services/ipfs';
import { selectBlockchainState } from '../store/slices/blockchainSlice';

const NFTContext = createContext(null);

export const useNFT = () => {
  const context = useContext(NFTContext);
  if (!context) {
    throw new Error('useNFT must be used within an NFTProvider');
  }
  return context;
};

const NFTProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { isConnected, account, provider } = useSelector(selectBlockchainState);
  const [nftContract, setNFTContract] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize NFT contract
  useEffect(() => {
    const initializeNFTContract = async () => {
      if (!isConnected || !provider) return;

      try {
        setIsLoading(true);
        setError(null);

        // Get contract address from environment
        const contractAddress = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error('NFT contract address not configured');
        }

        // Get contract ABI
        const response = await fetch('/contracts/ProductNFT.json');
        const { abi } = await response.json();

        // Create contract instance
        const contract = new ethers.Contract(
          contractAddress,
          abi,
          provider.getSigner()
        );

        setNFTContract(contract);
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize NFT contract:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeNFTContract();
  }, [isConnected, provider]);

  // Initialize IPFS when needed
  useEffect(() => {
    const initializeIPFS = async () => {
      try {
        await ipfsService.initialize();
      } catch (err) {
        console.error('Failed to initialize IPFS:', err);
        setError('Failed to initialize IPFS connection');
      }
    };

    if (isInitialized && !ipfsService.isInitialized) {
      initializeIPFS();
    }
  }, [isInitialized]);

  const mintNFT = async (metadata) => {
    if (!isInitialized || !nftContract) {
      throw new Error('NFT provider not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Upload metadata to IPFS
      const metadataHash = await ipfsService.uploadContent(JSON.stringify(metadata));
      
      // Create token URI
      const tokenURI = `ipfs://${metadataHash}`;

      // Mint NFT
      const tx = await nftContract.mint(account, tokenURI);
      const receipt = await tx.wait();

      // Get token ID from event
      const event = receipt.events.find(e => e.event === 'Transfer');
      const tokenId = event.args.tokenId.toString();

      // Pin content to ensure availability
      await ipfsService.pinContent(metadataHash);

      return {
        tokenId,
        tokenURI,
        transaction: tx.hash
      };
    } catch (err) {
      console.error('Failed to mint NFT:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadToIPFS = async (file) => {
    if (!isInitialized) {
      throw new Error('NFT provider not initialized');
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await ipfsService.uploadFile(file);
      await ipfsService.pinContent(result.cid);

      return result;
    } catch (err) {
      console.error('Failed to upload to IPFS:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isInitialized,
    isLoading,
    error,
    mintNFT,
    uploadToIPFS,
    nftContract
  };

  if (!isConnected) {
    return children;
  }

  return (
    <NFTContext.Provider value={value}>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </NFTContext.Provider>
  );
};

export default NFTProvider;
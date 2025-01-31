import React, { useState } from 'react';
import { blockchainService } from '../../services/blockchain';

const NFTMintingControls = ({ onMintSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    price: '',
    tokenURI: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await blockchainService.createProduct(
        formData.name,
        formData.manufacturer,
        formData.price,
        formData.tokenURI
      );

      setFormData({
        name: '',
        manufacturer: '',
        price: '',
        tokenURI: ''
      });

      if (onMintSuccess) {
        onMintSuccess(response);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">NFT Minting Controls</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
          <input
            type="text"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Token URI</label>
          <input
            type="text"
            name="tokenURI"
            value={formData.tokenURI}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="ipfs://..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isLoading ? 'Minting...' : 'Mint NFT'}
        </button>
      </form>
    </div>
  );
};

export default NFTMintingControls;
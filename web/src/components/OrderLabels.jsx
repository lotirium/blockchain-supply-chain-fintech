import React from 'react';
import UVHologramViewer from './UVHologramViewer';

const API_URL = import.meta.env.VITE_API_URL;

const OrderLabels = ({ qrCode, hologramPath, tokenId, onDownloadQR }) => {
  if (!qrCode && !hologramPath) {
    return null;
  }

  const fullHologramPath = hologramPath ? `${API_URL}${hologramPath}` : null;
  
  const handleDownloadHologram = () => {
    if (fullHologramPath) {
      const link = document.createElement('a');
      link.href = fullHologramPath;
      link.download = `uv-hologram-${tokenId || 'label'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
      <div className="text-center">
        <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4">Product QR Code</h3>
        {qrCode && (
          <div className="bg-white p-4 rounded-lg shadow-md inline-block">
            <img
              src={qrCode}
              alt="Order QR Code"
              className="w-48 h-48 mx-auto"
            />
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2 mb-4">
          This QR code can be scanned to verify product authenticity
        </p>
        <button
          onClick={onDownloadQR}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 text-sm w-full md:w-auto"
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download QR Code
          </div>
        </button>
      </div>

      <div className="text-center">
        <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4">UV Security Hologram</h3>
        {fullHologramPath && (
          <div className="bg-white p-4 rounded-lg shadow-md inline-block">
            <UVHologramViewer 
              hologramPath={fullHologramPath}
            />
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2 mb-4">
          Scan this UV hologram using a digital scope to confirm and register authentication confirmation
        </p>
        {tokenId && (
          <p className="text-xs text-gray-500 mt-2 mb-4">
            Hidden Token: <span className="font-mono bg-gray-200 px-1 py-0.5 rounded">{tokenId}</span>
          </p>
        )}
        <button
          onClick={handleDownloadHologram}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors duration-200 text-sm w-full md:w-auto"
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download UV Hologram
          </div>
        </button>
      </div>
    </div>
  );
};

export default OrderLabels;
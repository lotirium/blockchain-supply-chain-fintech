import React from 'react';
import UVHologramViewer from './UVHologramViewer';

const API_URL = import.meta.env.VITE_API_URL;

const OrderLabels = ({ qrCode, hologramPath, tokenId, onDownloadQR }) => {
  if (!qrCode && !hologramPath) {
    return null;
  }

  const fullHologramPath = hologramPath ? `${API_URL}${hologramPath}` : null;

  return (
    <div className="flex gap-8">
      <div>
        {qrCode && (
          <>
            <img
              src={qrCode}
              alt="Order QR Code"
              className="w-48 h-48"
            />
            <button
              onClick={onDownloadQR}
              className="mt-2 border p-2 w-full"
            >
              Download QR Code
            </button>
          </>
        )}
      </div>

      <div>
        {fullHologramPath && (
          <UVHologramViewer 
            hologramPath={fullHologramPath}
          />
        )}
      </div>
    </div>
  );
};

export default OrderLabels;
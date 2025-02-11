import React from 'react';
import { useSelector } from 'react-redux';

const OrderLabels = ({ qrCode, onDownloadQR, showQRCodeOnly = false }) => {
  const user = useSelector(state => state.auth.user);
  const store = user?.store;
  const API_URL = import.meta.env.VITE_API_URL;
  const hologramUrl = user?.store?.hologram_label ? `${import.meta.env.VITE_API_URL}${user.store.hologram_label}` : null;

  if (!qrCode && !hologramUrl) {
    return null;
  }

  const handleDownloadHologram = () => {
    if (hologramUrl) {
      const link = document.createElement('a');
      link.href = hologramUrl;
      link.download = `store-${store?.id}-hologram.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h4 className="font-medium text-gray-700 mb-4">Product Package Labels</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h5 className="font-medium text-gray-600">QR Code</h5>
          <div className="flex justify-center">
            {qrCode ? (
              <img
                src={qrCode}
                alt="Order QR Code"
                className="w-48 h-48 border p-2"
              />
            ) : (
              <div className="w-48 h-48 border p-2 flex items-center justify-center bg-gray-50 text-gray-400">
                QR Code not generated
              </div>
            )}
          </div>
          {qrCode && (
            <button
              onClick={onDownloadQR}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Download QR Code
            </button>
          )}
        </div>

        <div className="space-y-4">
          <h5 className="font-medium text-gray-600">Store Hologram</h5>
          <div className="flex justify-center">
            {hologramUrl ? (
              <img
                src={hologramUrl}
                alt="Store Hologram"
                className="w-48 h-48 border p-2 object-contain bg-white"
                onError={(e) => {
                  console.error('Error loading hologram:', e);
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI4IiB5PSI4IiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTA5MDkwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+PzwvdGV4dD48L3N2Zz4=';
                }}
              />
            ) : (
              <div className="w-48 h-48 border p-2 flex items-center justify-center bg-gray-50 text-gray-400">
                No hologram available
              </div>
            )}
          </div>
          {hologramUrl && (
            <button
              onClick={handleDownloadHologram}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Download Hologram
            </button>
          )}
          {!hologramUrl && (
            <p className="text-sm text-gray-500 text-center">
              Please generate a hologram label in store settings first.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h5 className="font-medium text-blue-800 mb-2">Printing Instructions</h5>
        <ol className="list-decimal list-inside space-y-2 text-blue-700">
          <li>Download both the QR code and hologram images</li>
          <li>Print both labels on high-quality adhesive paper</li>
          <li>Place the QR code on the outer packaging where it's easily scannable</li>
          <li>Apply the hologram label near the product seal or on a tamper-evident location</li>
          <li>Ensure both labels are clearly visible and not damaged</li>
        </ol>
      </div>
    </div>
  );
};

export default OrderLabels;
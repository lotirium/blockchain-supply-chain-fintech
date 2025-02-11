import React, { useState } from 'react';
import QRScanner from '../components/blockchain/QRScanner';
import { verifyOrderQR } from '../services/qrcode';
import { format } from 'date-fns';

const ProductVerification = () => {
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleScan = async (qrData) => {
    if (qrData) {
      setScanning(false);
      setLoading(true);
      setError(null);

      try {
        const response = await verifyOrderQR(qrData);
        if (response.success) {
          setVerificationResult(response.data.verificationResult);
        } else {
          setError(response.message || 'Verification failed');
        }
      } catch (error) {
        setError(error.message);
        console.error('Verification error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleError = (err) => {
    console.error('QR Scanner error:', err);
    setError('Failed to access camera. Please ensure camera permissions are granted.');
  };

  const resetScan = () => {
    setScanning(true);
    setVerificationResult(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Product Verification</h1>

        {scanning && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Scan Product QR Code</h2>
            <div className="aspect-square max-w-md mx-auto mb-4">
              <QRScanner onScan={handleScan} onError={handleError} />
            </div>
            <p className="text-sm text-gray-600 text-center">
              Position the QR code within the frame to verify your product
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h2 className="text-red-800 font-semibold mb-2">Verification Failed</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={resetScan}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {verificationResult && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className={`p-4 ${verificationResult.isAuthentic ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              <h2 className="text-2xl font-bold">
                {verificationResult.isAuthentic ? 'Authentic Product' : 'Invalid Product'}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Product Details</h3>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{verificationResult.product.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Manufacturer</dt>
                    <dd className="mt-1 text-sm text-gray-900">{verificationResult.product.manufacturer}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Store</dt>
                    <dd className="mt-1 text-sm text-gray-900">{verificationResult.store}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">NFT Token ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{verificationResult.product.tokenId}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  {verificationResult.order.timeline.map((event, index) => (
                    <div key={index} className="relative mb-8 ml-4 pl-6">
                      <div className="absolute left-0 -translate-x-2/4 w-4 h-4 rounded-full bg-white border-2 border-blue-500"></div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="font-medium text-gray-900 capitalize mb-1">
                          {event.status}
                        </div>
                        <time className="text-sm text-gray-500">
                          {format(new Date(event.time), 'PPP pp')}
                        </time>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Order Details</h3>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500">Order ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{verificationResult.order.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Current Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{verificationResult.order.status}</dd>
                  </div>
                </dl>
              </div>

              {verificationResult.nftMetadata && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">NFT Details</h3>
                  <dl className="grid grid-cols-1 gap-4">
                    <div>
                      <dt className="text-sm text-gray-500">Blockchain Address</dt>
                      <dd className="mt-1 text-sm text-gray-900 break-all">
                        {verificationResult.nftMetadata.tokenAddress}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Minted Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {format(new Date(verificationResult.nftMetadata.mintedAt), 'PPP')}
                      </dd>
                    </div>
                    {verificationResult.nftMetadata.attributes?.map((attr, index) => (
                      <div key={index}>
                        <dt className="text-sm text-gray-500 capitalize">{attr.trait_type}</dt>
                        <dd className="mt-1 text-sm text-gray-900">{attr.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Verified at: {format(new Date(verificationResult.verifiedAt), 'PPP pp')}
                </p>
              </div>

              <button
                onClick={resetScan}
                className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Verify Another Product
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductVerification;
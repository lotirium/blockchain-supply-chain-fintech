import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateStore } from '../store/slices/authSlice';
import { Wallet } from 'ethers';

function StoreSettings() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.store?.name || '',
    description: user?.store?.description || '',
    business_email: user?.store?.business_email || user?.email || '',
    business_phone: user?.store?.business_phone || '',
    business_address: user?.store?.business_address || '',
    wallet_address: user?.store?.wallet_address || '',
    shipping_policy: user?.store?.shipping_policy || '',
    return_policy: user?.store?.return_policy || ''
  });

  // Redirect if not a seller
  useEffect(() => {
    if (user && user.role !== 'seller') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateWallet = () => {
    try {
      const wallet = Wallet.createRandom();
      setFormData(prev => ({
        ...prev,
        wallet_address: wallet.address
      }));
    } catch (err) {
      console.error('Failed to generate wallet:', err);
      setError('Failed to generate Ethereum wallet. Please try again.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await dispatch(updateStore(formData)).unwrap();
      setSuccess(true);
      setError(null);
      // Wait 500ms then navigate to seller dashboard
      setTimeout(() => {
        navigate('/seller-dashboard');
      }, 500);
    } catch (err) {
      console.error('Store setup failed:', err);
      setError(err.message || 'Failed to update store settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/add-product');
  };

  const sampleData = {
    fashionStore: {
      name: 'Urban Chic Boutique',
      description: 'Curated fashion collections featuring trendy and timeless pieces for the modern wardrobe. We blend contemporary style with quality craftsmanship.',
      business_phone: '+1 (555) 234-5678',
      business_address: '789 Fashion Avenue\nFloor 3\nLos Angeles, CA 90015',
      shipping_policy: 'Free Standard Shipping on orders over $50\nStandard (5-7 days): $5.99\nExpress (2-3 days): $12.99\nNext Day: $24.99\n\nFree returns within the US.',
      return_policy: '45-day return window for unworn items with original tags\nFree returns via prepaid shipping label\nStore credit or full refund available\nExpress refunds within 3 business days'
    },
    electronicsStore: {
      name: 'Tech Haven',
      description: 'Premier destination for cutting-edge electronics and gadgets. We offer expert advice, competitive prices, and guaranteed authentic products.',
      business_phone: '+1 (555) 876-5432',
      business_address: '456 Innovation Park\nSuite 200\nSan Jose, CA 95110',
      shipping_policy: 'Free Standard Shipping on orders over $100\nStandard (3-5 days): $8.99\nExpress (2 days): $19.99\nSame Day Available in Select Areas\n\nInsured shipping on all orders',
      return_policy: '30-day worry-free returns\nFree returns for defective items\nTechnical support available for setup\n14-day price protection guarantee\nRestocking fee may apply for opened items'
    },
    artisanStore: {
      name: 'Handcrafted Treasures',
      description: 'Unique handmade crafts and artisanal products created with passion and care. Supporting local artisans and sustainable practices.',
      business_phone: '+1 (555) 345-6789',
      business_address: '321 Artisan Way\nMarket Square\nPortland, OR 97201',
      shipping_policy: 'Carefully packaged by hand\nStandard (5-7 days): $7.99\nExpress (3-4 days): $15.99\nCustom shipping for fragile items\n\nInternational shipping available',
      return_policy: 'Each item is unique and handmade with care\n21-day return window\nPlease contact us before returning\nCustom orders are non-returnable\nDamaged items will be replaced or refunded'
    }
  };

  const handleFillSample = () => {
    const storeTypes = Object.keys(sampleData);
    const randomType = storeTypes[Math.floor(Math.random() * storeTypes.length)];
    const sample = sampleData[randomType];
    
    // Only generate new wallet address if one doesn't exist
    const wallet_address = formData.wallet_address || Wallet.createRandom().address;
    
    // Merge existing data with sample data, keeping existing values
    setFormData(prev => ({
      name: prev.name || sample.name,
      description: prev.description || sample.description,
      business_email: prev.business_email || user?.email || `info@${sample.name.toLowerCase().replace(/\s+/g, '')}.com`,
      business_phone: prev.business_phone || sample.business_phone,
      business_address: prev.business_address || sample.business_address,
      wallet_address: prev.wallet_address || wallet_address,
      shipping_policy: prev.shipping_policy || sample.shipping_policy,
      return_policy: prev.return_policy || sample.return_policy
    }));
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Store Settings</h1>
        <p className="text-gray-600 mt-2">
          Set up your store information before adding products
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-md mb-6">
          Store settings saved successfully!
        </div>
      )}

      <div className="mb-6 relative">
        <button
          type="button"
          onClick={handleFillSample}
          className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Fill Missing Fields with Sample Data
        </button>
        <div className="mt-2 text-center text-sm text-gray-500">
          Available templates: Fashion Store, Electronics Store, Artisan Store
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Store Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  id="business_email"
                  name="business_email"
                  value={formData.business_email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Phone
                </label>
                <input
                  type="tel"
                  id="business_phone"
                  name="business_phone"
                  value={formData.business_phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="wallet_address" className="block text-sm font-medium text-gray-700 mb-1">
                Ethereum Wallet Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="wallet_address"
                  name="wallet_address"
                  value={formData.wallet_address}
                  onChange={handleInputChange}
                  required
                  pattern="^0x[a-fA-F0-9]{40}$"
                  title="Enter a valid Ethereum wallet address starting with 0x followed by 40 hexadecimal characters"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleGenerateWallet}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Generate
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Business Address
              </label>
              <textarea
                id="business_address"
                name="business_address"
                value={formData.business_address}
                onChange={handleInputChange}
                rows={3}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Store Policies</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="shipping_policy" className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Policy
              </label>
              <textarea
                id="shipping_policy"
                name="shipping_policy"
                value={formData.shipping_policy}
                onChange={handleInputChange}
                rows={4}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="return_policy" className="block text-sm font-medium text-gray-700 mb-1">
                Return Policy
              </label>
              <textarea
                id="return_policy"
                name="return_policy"
                value={formData.return_policy}
                onChange={handleInputChange}
                rows={4}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-600 mb-4">
            * Store setup is required before you can start adding products. This information helps build trust with your customers.
          </p>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 bg-blue-600 text-white rounded-md ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Continue to Add Product
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default StoreSettings;
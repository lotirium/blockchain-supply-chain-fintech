import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../store/slices/cartSlice';
import { createOrder } from '../services/api';
import { blockchainService } from '../services/blockchain';
import TransactionStatus from '../components/TransactionStatus';

function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionError, setTransactionError] = useState(null);
  const [logiCoinBalance, setLogiCoinBalance] = useState('0');
  const [isConverting, setIsConverting] = useState(false);

  const [formData, setFormData] = useState({
    // Shipping Info
    shippingFirstName: '',
    shippingLastName: '',
    shippingEmail: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    // Billing Info
    billingFirstName: '',
    billingLastName: '',
    billingEmail: '',
    billingPhone: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    // Payment Info
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  useEffect(() => {
    if (items.length === 0 && !isCheckingOut) {
      navigate('/cart');
    }
  }, [items.length, navigate, isCheckingOut]);

  // Load LogiCoin balance
  useEffect(() => {
    if (user?.wallet_address) {
      blockchainService.getLogiCoinBalance()
        .then(result => setLogiCoinBalance(result.logiCoinBalance))
        .catch(error => console.error('Failed to get LogiCoin balance:', error));
    }
  }, [user]);

  // Redirect to profile if user has no wallet
  useEffect(() => {
    if (!user) {
      return;
    }

    if (!user?.wallet_address) {
      navigate('/profile', { 
        state: { message: 'Please set up your wallet in your profile before proceeding with checkout.' },
        replace: false
      });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (sameAsShipping && formData.shippingFirstName) {
      setFormData(prev => ({
        ...prev,
        billingFirstName: prev.shippingFirstName,
        billingLastName: prev.shippingLastName,
        billingEmail: prev.shippingEmail,
        billingPhone: prev.shippingPhone,
        billingAddress: prev.shippingAddress,
        billingCity: prev.shippingCity,
        billingState: prev.shippingState,
        billingZip: prev.shippingZip
      }));
    }
  }, [sameAsShipping, formData.shippingFirstName, formData.shippingLastName, 
      formData.shippingEmail, formData.shippingPhone, formData.shippingAddress,
      formData.shippingCity, formData.shippingState, formData.shippingZip]);

  const handleConvertToLogiCoin = async () => {
    try {
      setIsConverting(true);
      setTransactionError(null);

      // Convert USD to cents first (e.g. $10.99 -> 1099)
      // Then the contract will multiply by 100 for LogiCoin conversion
      const result = await blockchainService.convertUSDToLogiCoin(Math.ceil(total));
      if (result.success) {
        await updateLogiCoinBalance();
        setTransactions(prev => [...prev, {
          id: 'convert',
          hash: result.transaction,
          status: 'success',
          type: 'conversion'
        }]);
      }
    } catch (error) {
      console.error('Failed to convert to LogiCoin:', error);
      setTransactionError(error.message);
    } finally {
      setIsConverting(false);
    }
  };

  const updateLogiCoinBalance = async () => {
    try {
      const result = await blockchainService.getLogiCoinBalance();
      setLogiCoinBalance(result.logiCoinBalance);
    } catch (error) {
      console.error('Failed to update LogiCoin balance:', error);
    }
  };

  useEffect(() => {
    if (user?.wallet_address) {
      updateLogiCoinBalance().catch(error => 
        console.error('Failed to get initial LogiCoin balance:', error)
      );
    }
  }, [user]);

  const generateRandomData = () => {
    // Keep the original random data generation function
    const firstNames = ['John', 'Emma', 'Michael', 'Sarah', 'David', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    const states = ['NY', 'CA', 'IL', 'TX', 'AZ'];
    const streets = ['Main St', 'Oak Ave', 'Maple Rd', 'Cedar Ln', 'Pine Dr'];

    const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomState = states[Math.floor(Math.random() * states.length)];
    const randomStreet = streets[Math.floor(Math.random() * streets.length)];
    const randomStreetNum = Math.floor(Math.random() * 9000) + 1000;
    const randomZip = Math.floor(Math.random() * 90000) + 10000;
    const randomPhone = `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    const randomCardNum = `${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`;
    const randomExpiry = `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${Math.floor(Math.random() * 5) + 24}`;
    const randomCvc = `${Math.floor(Math.random() * 900) + 100}`;

    return {
      shippingFirstName: randomFirst,
      shippingLastName: randomLast,
      shippingEmail: `${randomFirst.toLowerCase()}.${randomLast.toLowerCase()}@${randomDomain}`,
      shippingPhone: randomPhone,
      shippingAddress: `${randomStreetNum} ${randomStreet}`,
      shippingCity: randomCity,
      shippingState: randomState,
      shippingZip: String(randomZip),
      billingFirstName: randomFirst,
      billingLastName: randomLast,
      billingEmail: `${randomFirst.toLowerCase()}.${randomLast.toLowerCase()}@${randomDomain}`,
      billingPhone: randomPhone,
      billingAddress: `${randomStreetNum} ${randomStreet}`,
      billingCity: randomCity,
      billingState: randomState,
      billingZip: String(randomZip),
      cardNumber: randomCardNum,
      cardExpiry: randomExpiry,
      cardCvc: randomCvc,
    };
  };

  const handleFillRandom = () => {
    const randomData = generateRandomData();
    setFormData(prev => ({
      ...prev,
      ...randomData
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsCheckingOut(true);
    setTransactionError(null);
    setTransactions([]);
    let blockchainTxs = [];

    try {
        // Validate items have store_id
        if (items.some(item => !item.store_id)) {
            throw new Error('Some items are missing store information');
        }

        // Convert total to BigInt explicitly
        const totalInCents = BigInt(Math.ceil(total)) * 100n;

        // Refresh LogiCoin balance before checking
        await updateLogiCoinBalance();

        // Log balances for debugging
        console.log('Payment attempt:', { required: totalInCents.toString(), available: logiCoinBalance });

        // Check LogiCoin balance
        if (BigInt(logiCoinBalance) < totalInCents) {
            throw new Error('Insufficient LogiCoin balance. Please convert USD to LogiCoin first.');
        }

        // Process blockchain payments first
        setBlockchainLoading(true);
        for (const item of items) {
            try {
                // First approve LogiCoin spending
                // Convert price to cents first (e.g. $89.99 -> 8999)
                // Contract will multiply by EXCHANGE_RATE (100) for final LogiCoin amount
                const logiCoinAmount = Math.round(item.price * 100);
                const approveResult = await blockchainService.approveLogiCoinSpending(logiCoinAmount);
                if (!approveResult.success) {
                    throw new Error(`Failed to approve LogiCoin spending for item ${item.id}`);
                }

                // Then pay for product
                const paymentResult = await blockchainService.payForProduct(item.id);
                if (!paymentResult.success) {
                    throw new Error(`Failed to process blockchain payment for item ${item.id}`);
                }

                setTransactions(prev => [...prev, {
                    id: item.id,
                    hash: paymentResult.transaction,
                    status: 'success'
                }]);

                blockchainTxs.push({
                    product_id: item.id,
                    transaction: paymentResult.transaction,
                    amount: paymentResult.price,
                    block_number: paymentResult.blockNumber
                });
            } catch (error) {
                console.error('Blockchain payment failed:', error);
                setTransactionError(error.message);
                throw new Error(`Blockchain payment failed: ${error.message}`);
            }
        }
        setBlockchainLoading(false);

        // Create order
        const orderData = {
            items: items.map((item, index) => ({
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.price,
                store_id: item.store_id || item.store?.id,
                total_price: item.price * item.quantity,
                blockchain_tx: blockchainTxs[index]?.transaction,
                block_number: blockchainTxs[index]?.block_number
            })),
            shipping_address: {
                full_name: `${formData.shippingFirstName} ${formData.shippingLastName}`,
                email: formData.shippingEmail,
                phone: formData.shippingPhone,
                address_line: formData.shippingAddress,
                city: formData.shippingCity,
                state: formData.shippingState,
                postal_code: formData.shippingZip
            },
            billing_address: sameAsShipping ? {
                full_name: `${formData.shippingFirstName} ${formData.shippingLastName}`,
                email: formData.shippingEmail,
                phone: formData.shippingPhone,
                address_line: formData.shippingAddress,
                city: formData.shippingCity,
                state: formData.shippingState,
                postal_code: formData.shippingZip
            } : {
                full_name: `${formData.billingFirstName} ${formData.billingLastName}`,
                email: formData.billingEmail,
                phone: formData.billingPhone,
                address_line: formData.billingAddress,
                city: formData.billingCity,
                state: formData.billingState,
                postal_code: formData.billingZip
            },
            payment_info: {
                method: 'logicoin',
                blockchain_txs: blockchainTxs
            }
        };

        const result = await createOrder(orderData);

        if (result.success) {
            navigate('/checkout/success', {
                replace: true,
                state: {
                    orderDetails: {
                        orderId: result.orderId,
                        date: new Date().toISOString(),
                        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
                    },
                    subtotal: total.toFixed(2),
                    total: total.toFixed(2),
                    shippingAddress: `${formData.shippingFirstName} ${formData.shippingLastName}, ${formData.shippingAddress}, ${formData.shippingCity}, ${formData.shippingState} ${formData.shippingZip}`,
                    blockchainTxs
                }
            });
            dispatch(clearCart());
            return;
        } else {
            throw new Error(result.message || 'Failed to create order');
        }
    } catch (error) {
        console.error('Checkout failed:', error);
        setTransactionError(error.message);
        setIsCheckingOut(false);
    } finally {
        setBlockchainLoading(false);
        setLoading(false);
    }
};

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {/* LogiCoin Balance */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold mb-2">Your LogiCoin Balance</h2>
            <p className="text-gray-600">{(BigInt(logiCoinBalance) / 100n).toString()} USD ({logiCoinBalance} LogiCoin)</p>
          </div>
          <button
            onClick={handleConvertToLogiCoin}
            disabled={isConverting || !user?.wallet_address}
            className={`px-6 py-2 rounded-md ${
              isConverting || !user?.wallet_address
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isConverting ? 'Converting...' : `Convert ${Math.ceil(total)} USD to LogiCoin`}
          </button>
        </div>
      </div>

      {/* Transaction Status */}
      {transactions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Transaction Status</h2>
          {transactions.map((tx) => (
            <TransactionStatus
              key={tx.id}
              transaction={tx.hash}
              status={tx.status}
              type={tx.type}
            />
          ))}
        </div>
      )}

      {transactionError && (
        <div className="mb-8">
          <TransactionStatus
            error={transactionError}
            status="error"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleFillRandom}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Fill Sample Data</span>
              </button>
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Shipping Information</h2>
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        shippingFirstName: user.firstName || '',
                        shippingLastName: user.lastName || '',
                        shippingEmail: user.email || '',
                        shippingPhone: user.phone || '',
                        shippingAddress: user.address || '',
                        shippingCity: user.city || '',
                        shippingState: user.state || '',
                        shippingZip: user.zipCode || ''
                      }));
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Auto-fill from Profile
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="shippingFirstName"
                    value={formData.shippingFirstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="shippingLastName"
                    value={formData.shippingLastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="shippingEmail"
                    value={formData.shippingEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="shippingPhone"
                    value={formData.shippingPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="shippingCity"
                    value={formData.shippingCity}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="shippingState"
                    value={formData.shippingState}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="shippingZip"
                    value={formData.shippingZip}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Billing Information</h2>
                <div className="flex items-center space-x-4">
                  {user && !sameAsShipping && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          billingFirstName: user.firstName || '',
                          billingLastName: user.lastName || '',
                          billingEmail: user.email || '',
                          billingPhone: user.phone || '',
                          billingAddress: user.address || '',
                          billingCity: user.city || '',
                          billingState: user.state || '',
                          billingZip: user.zipCode || ''
                        }));
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Auto-fill from Profile
                    </button>
                  )}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sameAsShipping}
                      onChange={(e) => setSameAsShipping(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">
                      Same as shipping
                    </span>
                  </label>
                </div>
              </div>

              {!sameAsShipping && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="billingFirstName"
                      value={formData.billingFirstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="billingLastName"
                      value={formData.billingLastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="billingEmail"
                      value={formData.billingEmail}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="billingPhone"
                      value={formData.billingPhone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="billingAddress"
                      value={formData.billingAddress}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="billingCity"
                      value={formData.billingCity}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="billingState"
                      value={formData.billingState}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="billingZip"
                      value={formData.billingZip}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || blockchainLoading || !user?.wallet_address}
              className={`w-full bg-blue-600 text-white px-6 py-3 rounded-md ${
                loading || blockchainLoading || !user?.wallet_address
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-700 transition-colors'
              }`}
            >
              {loading || blockchainLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {blockchainLoading ? 'Processing Blockchain Payment...' : 'Processing Order...'}
                </span>
              ) : (
                `Place Order - $${total.toFixed(2)}`
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:pl-8">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex items-center">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-600 ml-2">x{item.quantity}</span>
                  </div>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between mt-2 font-bold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
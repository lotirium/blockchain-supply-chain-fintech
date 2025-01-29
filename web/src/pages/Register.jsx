import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/slices/authSlice';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { error, user, isAuthenticated } = useSelector((state) => state.auth);

  const [registrationStep, setRegistrationStep] = useState(1);
  const [formData, setFormData] = useState({
    userType: 'buyer',
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    store: {
      name: '',
      description: '',
      businessPhone: '',
      businessAddress: '',
    }
  });

  const [validationErrors, setValidationErrors] = useState({});


  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'seller') {
        navigate('/verification-pending');
      } else if (user?.role === 'buyer') {
        navigate('/');
      }
    }
  }, [user, isAuthenticated, navigate]);

  const validateStep1 = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email format';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};
    if (!formData.store.name.trim()) errors.storeName = 'Store name is required';
    if (!formData.store.businessPhone.trim()) errors.businessPhone = 'Business phone is required';
    if (!formData.store.businessAddress.trim()) errors.businessAddress = 'Business address is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generateRandomData = (step) => {
    const firstNames = ['John', 'Emma', 'Michael', 'Sarah', 'David', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const storeTypes = ['Electronics', 'Fashion', 'Home', 'Books', 'Sports'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];

    switch (step) {
      case 2:
        const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
        const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
        const randomDomain = domains[Math.floor(Math.random() * domains.length)];
        return {
          firstName: randomFirst,
          lastName: randomLast,
          email: `${randomFirst.toLowerCase()}.${randomLast.toLowerCase()}@${randomDomain}`,
          username: `${randomFirst.toLowerCase()}${randomLast.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
          password: 'Password123!',
          confirmPassword: 'Password123!'
        };
      case 3:
        const storeType = storeTypes[Math.floor(Math.random() * storeTypes.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const ownerName = lastNames[Math.floor(Math.random() * lastNames.length)];
        return {
          store: {
            name: `${ownerName}'s ${storeType}`,
            description: `Quality ${storeType.toLowerCase()} for everyone. We provide the best products at competitive prices.`,
            businessPhone: `+1${Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')}`,
            businessAddress: `${Math.floor(Math.random() * 1000) + 1} Main St, ${city}, US`
          }
        };
      default:
        return {};
    }
  };

  const handleFillRandom = (step) => {
    const randomData = generateRandomData(step);
    setFormData(prev => ({
      ...prev,
      ...(step === 3 ? {
        store: {
          ...prev.store,
          ...randomData.store
        }
      } : randomData)
    }));
    setValidationErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('store.')) {
      const storeField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        store: {
          ...prev.store,
          [storeField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNext = (e) => {
    e?.preventDefault();
    
    let isValid = false;
    
    switch (registrationStep) {
      case 1:
        // Always valid for step 1 as it's just selecting account type
        isValid = true;
        break;
      case 2:
        isValid = validateStep2();
        if (isValid && formData.userType === 'buyer') {
          handleSubmit();
          return;
        }
        break;
      case 3:
        isValid = validateStep3();
        if (isValid) {
          handleSubmit();
          return;
        }
        break;
      default:
        break;
    }

    if (isValid) {
      setRegistrationStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setRegistrationStep(prev => prev - 1);
  };

    const handleSubmit = async (e) => {
      e?.preventDefault();
      
      if (formData.userType !== 'buyer' && !validateStep3()) {
        return;
      }

      // Validate all required fields before submission
      if (!validateStep1() || !validateStep2() || (formData.userType === 'seller' && !validateStep3())) {
        return;
      }

      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
        userType: formData.userType,
        ...(formData.userType === 'seller' && {
          store: {
            name: formData.store.name.trim(),
            description: formData.store.description.trim(),
            businessPhone: formData.store.businessPhone.trim(),
            businessAddress: formData.store.businessAddress.trim(),
            type: 'seller'
          }
        })
      };

      try {
        console.log('Starting registration process...', { userType: formData.userType });
        await dispatch(register(registrationData)).unwrap();
        console.log('Registration successful');
        // Let the useEffect handle navigation
      } catch (err) {
        console.error('Registration failed:', err);
        alert(err.message || 'Registration failed');
      }
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Account Type', description: 'Choose your role' },
      { number: 2, title: 'Your Details', description: 'Personal information' },
      formData.userType === 'seller' && { number: 3, title: 'Store Setup', description: 'Business details' }
    ].filter(Boolean);

    return (
      <div className="relative mb-8">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200">
          <div
            className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${((registrationStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
        <div className="relative flex justify-between">
          {steps.map(({ number, title, description }) => (
            <div key={number} className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                  number === registrationStep
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-110 shadow-lg'
                    : number < registrationStep
                    ? 'bg-gradient-to-r from-green-400 to-teal-500 text-white'
                    : 'bg-white border-2 border-gray-200 text-gray-400'
                }`}
              >
                {number < registrationStep ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-lg font-semibold">{number}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${
                  number === registrationStep ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {title}
                </p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAccountTypeStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, userType: 'buyer' }))}
          className={`relative p-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${
            formData.userType === 'buyer'
              ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-500 shadow-md'
              : 'bg-white border-2 border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              formData.userType === 'buyer'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Buyer</h3>
            <p className="mt-2 text-sm text-gray-500">Shop from our marketplace</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, userType: 'seller' }))}
          className={`relative p-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${
            formData.userType === 'seller'
              ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-500 shadow-md'
              : 'bg-white border-2 border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              formData.userType === 'seller'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Seller</h3>
            <p className="mt-2 text-sm text-gray-500">Start your own store</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderPersonalInfoStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
          />
          {validationErrors.firstName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
          />
          {validationErrors.lastName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
        />
        {validationErrors.email && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
        />
        {validationErrors.username && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.username}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
        />
        {validationErrors.password && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
        />
        {validationErrors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
        )}
      </div>
    </div>
  );

  const renderStoreSetupStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Store Name</label>
        <input
          type="text"
          name="store.name"
          value={formData.store.name}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
        />
        {validationErrors.storeName && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.storeName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Store Description</label>
        <textarea
          name="store.description"
          value={formData.store.description}
          onChange={handleInputChange}
          rows="3"
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Business Phone</label>
        <input
          type="tel"
          name="store.businessPhone"
          value={formData.store.businessPhone}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
        />
        {validationErrors.businessPhone && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.businessPhone}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Business Address</label>
        <input
          type="text"
          name="store.businessAddress"
          value={formData.store.businessAddress}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
        />
        {validationErrors.businessAddress && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.businessAddress}</p>
        )}
      </div>
    </div>
  );

  const renderNavigationButtons = () => (
    <div className="flex justify-between space-x-4 mt-8">
      {registrationStep > 1 && (
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 py-3 px-4 bg-white border-2 border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300"
        >
          Back
        </button>
      )}
      <button
        type="button"
          onClick={handleNext}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
      >
        {registrationStep === 2 && formData.userType === 'buyer'
          ? 'Register'
          : registrationStep === 3
          ? 'Create Store'
          : 'Continue'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        <div className="w-full flex flex-col items-center justify-center px-12 text-white">
          <h1 className="text-5xl font-bold mb-6">Welcome to Our Marketplace</h1>
          <p className="text-xl text-blue-100 text-center mb-8">
            Join our community and discover amazing products or start your own store.
          </p>
          <div className="w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Secure Platform</h3>
                  <p className="text-blue-100">Your data is always protected</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Fast & Easy</h3>
                  <p className="text-blue-100">Start selling in minutes</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Growing Community</h3>
                  <p className="text-blue-100">Join thousands of users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-gray-50">
        <div className="mx-auto w-full max-w-xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
            <p className="mt-3 text-gray-500">
              {registrationStep === 1
                ? 'Choose how you want to use our platform'
                : registrationStep === 2
                ? 'Tell us about yourself'
                : 'Set up your store'}
            </p>
          </div>

          {renderStepIndicator()}

          <div className="bg-white shadow-xl rounded-xl p-8 relative">
            {registrationStep > 1 && (
              <button
                type="button"
                onClick={() => handleFillRandom(registrationStep)}
                className="absolute top-4 right-4 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors duration-200 flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Fill Sample Data</span>
              </button>
            )}
            {registrationStep === 1 && renderAccountTypeStep()}
            {registrationStep === 2 && renderPersonalInfoStep()}
            {registrationStep === 3 && renderStoreSetupStep()}
            {renderNavigationButtons()}
          </div>
        </div>
      </div>


    </div>
  );
};

export default Register;
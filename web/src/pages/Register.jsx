import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      business_phone: '',
      business_address: '',
    }
  });

  const [validationErrors, setValidationErrors] = useState({});

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
    if (!formData.store.business_phone.trim()) errors.business_phone = 'Business phone is required';
    if (!formData.store.business_address.trim()) errors.business_address = 'Business address is required';
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
          password: '12345678',
          confirmPassword: '12345678'
        };
      case 3:
        const storeType = storeTypes[Math.floor(Math.random() * storeTypes.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const ownerName = lastNames[Math.floor(Math.random() * lastNames.length)];
        return {
          store: {
            name: `${ownerName}'s ${storeType}`,
            description: `Quality ${storeType.toLowerCase()} for everyone. We provide the best products at competitive prices.`,
            business_phone: `+1${Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')}`,
            business_address: `${Math.floor(Math.random() * 1000) + 1} Main St, ${city}, US`
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Success toast component
  const SuccessToast = () => (
    <div className="fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg transition-all duration-500 transform translate-x-0 z-50">
      <div className="flex items-center">
        <div className="py-1">
          <svg className="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <p className="font-bold">Registration Successful!</p>
          <p className="text-sm">Welcome to our marketplace. Redirecting...</p>
        </div>
      </div>
    </div>
  );

  const handleNext = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    let isValid = false;
    
    switch (registrationStep) {
      case 1:
        // Always valid for step 1 as it's just selecting account type
        isValid = true;
        break;
      case 2:
        isValid = validateStep2();
        if (isValid && formData.userType === 'buyer') {
          if (!isSubmitting) {
            await handleSubmit();
          }
          return;
        }
        break;
      case 3:
        isValid = validateStep3();
        if (isValid) {
          if (!isSubmitting) {
            await handleSubmit();
          }
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
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isSubmitting) {
      return;
    }

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
          business_phone: formData.store.business_phone.trim(),
          business_address: formData.store.business_address.trim(),
          type: 'seller'
        }
      })
    };

    try {
      setIsSubmitting(true);
      console.log('Starting registration process...', { userType: formData.userType });
      const result = await dispatch(register(registrationData)).unwrap();
      console.log('Registration successful');
      setShowSuccess(true);
      
      // Wait 1.5 seconds then navigate
      setTimeout(() => {
        if (formData.userType === 'seller') {
          navigate('/verification-pending');
        } else {
          navigate('/profile');
        }
      }, 500);
    } catch (err) {
      console.error('Registration failed:', err);
      alert(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
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
              ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-500 shadow-lg'
              : 'bg-white border-2 border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              formData.userType === 'buyer'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
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
              ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-500 shadow-lg'
              : 'bg-white border-2 border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              formData.userType === 'seller'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
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
        <div className="group">
          <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-blue-600 transition-colors duration-200">First Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="pl-10 w-full py-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              placeholder="John"
            />
          </div>
          {validationErrors.firstName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
          )}
        </div>
        
        <div className="group">
          <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-blue-600 transition-colors duration-200">Last Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="pl-10 w-full py-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              placeholder="Smith"
            />
          </div>
          {validationErrors.lastName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
          )}
        </div>
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-blue-600 transition-colors duration-200">Email</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="pl-10 w-full py-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            placeholder="your@email.com"
          />
        </div>
        {validationErrors.email && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
        )}
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-blue-600 transition-colors duration-200">Username</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className="pl-10 w-full py-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            placeholder="johnsmith123"
          />
        </div>
        {validationErrors.username && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.username}</p>
        )}
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-blue-600 transition-colors duration-200">Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="pl-10 w-full py-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            placeholder="••••••••"
          />
        </div>
        {validationErrors.password && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-blue-600 transition-colors duration-200">Confirm Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="pl-10 w-full py-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            placeholder="••••••••"
          />
        </div>
        {validationErrors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
        )}
      </div>
    </div>
  );

  const renderStoreSetupStep = () => (
    <div className="space-y-6">
      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-blue-600 transition-colors duration-200">Store Name</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <input
            type="text"
            name="store.name"
            value={formData.store.name}
            onChange={handleInputChange}
            className="pl-10 w-full py-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            placeholder="Smith's Electronics"
          />
        </div>
        {validationErrors.storeName && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.storeName}</p>
        )}
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-blue-600 transition-colors duration-200">Store Description</label>
        <div className="relative">
          <div className="absolute top-3 left-3 flex items-start pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <textarea
            name="store.description"
            value={formData.store.description}
            onChange={handleInputChange}
            rows="3"
            className="pl-10 w-full py-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            placeholder="Describe your business and what makes it unique..."
          />
        </div>
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-blue-600 transition-colors duration-200">Business Phone</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <input
            type="tel"
            name="store.business_phone"
            value={formData.store.business_phone}
            onChange={handleInputChange}
            className="pl-10 w-full py-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            placeholder="+1 (123) 456-7890"
          />
        </div>
        {validationErrors.business_phone && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.business_phone}</p>
        )}
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-blue-600 transition-colors duration-200">Business Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input
            type="text"
            name="store.business_address"
            value={formData.store.business_address}
            onChange={handleInputChange}
            className="pl-10 w-full py-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            placeholder="123 Main St, New York, NY 10001"
          />
        </div>
        {validationErrors.business_address && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.business_address}</p>
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
          className="flex-1 py-3 px-4 bg-white border-2 border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
        >
          Back
        </button>
      )}
      <button
        type="button"
        onClick={handleNext}
        disabled={isSubmitting}
        className={`flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-medium
          ${!isSubmitting ? 'hover:from-blue-600 hover:to-purple-600' : 'opacity-75 cursor-not-allowed'}
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300
          flex items-center justify-center space-x-2 transform hover:-translate-y-1 hover:shadow-lg`}
      >
        {isSubmitting && (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        <span>
          {registrationStep === 2 && formData.userType === 'buyer'
            ? isSubmitting ? 'Registering...' : 'Register'
            : registrationStep === 3
            ? isSubmitting ? 'Creating Store...' : 'Create Store'
            : 'Continue'}
        </span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-400/30 to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-t from-pink-500/20 to-transparent rounded-full"></div>
        
        <div className="w-full flex flex-col items-center justify-center px-12 text-white relative z-10">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-white blur-lg opacity-20 rounded-full"></div>
              <span className="relative text-5xl font-bold text-white z-10">
                LogiShop
              </span>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-6 text-center">Join Our Marketplace</h1>
          <p className="text-xl text-blue-100 text-center mb-12 max-w-2xl">
            Create an account to discover amazing products or start your own verified store with blockchain technology.
          </p>
          
          <div className="w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Blockchain Verified</h3>
                  <p className="text-blue-100">All products authenticated on blockchain</p>
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

          <div className="bg-white shadow-2xl rounded-xl p-8 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-b from-purple-100 to-transparent rounded-bl-full opacity-70"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-t from-blue-100 to-transparent rounded-tr-full opacity-70"></div>
            
            {registrationStep > 1 && (
              <button
                type="button"
                onClick={() => handleFillRandom(registrationStep)}
                className="absolute top-4 right-4 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors duration-200 flex items-center space-x-1 z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Fill Sample Data</span>
              </button>
            )}
            <div className="relative z-10">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 animate-pulse">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="font-medium">{error}</p>
                  </div>
                </div>
              )}
              
              {registrationStep === 1 && renderAccountTypeStep()}
              {registrationStep === 2 && renderPersonalInfoStep()}
              {registrationStep === 3 && renderStoreSetupStep()}
              {renderNavigationButtons()}
            </div>
          </div>
          
          {/* Trust badges */}
          <div className="text-center mt-10">
            <p className="text-sm text-gray-500 mb-3">Protected by</p>
            <div className="flex justify-center space-x-6">
              <div className="w-24 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-500 font-medium text-xs">SECURE PAY</span>
              </div>
              <div className="w-24 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-500 font-medium text-xs">BLOCKCHAIN</span>
              </div>
              <div className="w-24 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-500 font-medium text-xs">VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
  
        {/* Success Toast */}
        {showSuccess && <SuccessToast />}
  
      </div>
    </div>
  );
};

export default Register;
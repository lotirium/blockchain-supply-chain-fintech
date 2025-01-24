import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/slices/authSlice';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, user, isAuthenticated } = useSelector((state) => state.auth);

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
      phone: '',
      address: '',
    }
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [processingStatus, setProcessingStatus] = useState({
    step: '', // current processing step
    message: '', // status message
    error: null // error message if any
  });

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'user') {
        navigate('/');
      } else if (user?.role === 'seller') {
        navigate('/seller-dashboard');
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
    if (!formData.store.phone.trim()) errors.storePhone = 'Phone number is required';
    if (!formData.store.address.trim()) errors.storeAddress = 'Address is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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

  const handleNext = () => {
    if (registrationStep === 1 && validateStep1()) {
      setRegistrationStep(2);
    } else if (registrationStep === 2 && validateStep2()) {
      if (formData.userType === 'buyer') {
        handleSubmit();
      } else {
        setRegistrationStep(3);
      }
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

    const registrationData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      username: formData.username.trim(),
      password: formData.password,
      userType: formData.userType,
      role: formData.userType, // Use the actual userType as the role
      ...(formData.userType !== 'buyer' && {
        store: {
          name: formData.store.name.trim(),
          description: formData.store.description.trim(),
          phone: formData.store.phone.trim(),
          address: formData.store.address.trim(),
          type: formData.userType // Use userType directly as store type
        }
      })
    };

    try {
      setProcessingStatus({
        step: 'account',
        message: 'Creating your account...',
        error: null
      });
      
      await dispatch(register(registrationData)).unwrap();
      
      // Navigate based on user type
      if (formData.userType === 'buyer') {
        navigate('/');
      } else {
        navigate('/seller-dashboard');
      }
    } catch (err) {
      setProcessingStatus({
        step: 'error',
        message: '',
        error: err.message || 'Registration failed'
      });
    }
  };

  const renderStatusMessage = () => {
    if (!processingStatus.step) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
          {processingStatus.error ? (
            // Error state
            <div className="text-red-600 text-center">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <h3 className="text-xl font-semibold mt-4">Registration Failed</h3>
              <p className="mt-2 text-gray-600">{processingStatus.error}</p>
              <button
                onClick={() => setProcessingStatus({ step: '', message: '', error: null })}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            // Processing state
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-center font-medium">{processingStatus.message}</p>
              {processingStatus.step === 'verification' && (
                <div className="mt-4 text-sm text-gray-500 text-center">
                  <p>Your store is pending verification.</p>
                  <p>We'll notify you once the verification is complete.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Account Type</label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`${
                formData.userType === 'buyer'
                  ? 'ring-2 ring-blue-600 bg-blue-50'
                  : 'bg-white'
              } border rounded-lg p-4 text-center hover:bg-gray-50`}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  userType: 'buyer'
                }));
              }}
            >
              <span className="block text-sm font-medium">Buyer</span>
            </button>
            <button
              type="button"
              className={`${
                formData.userType === 'seller'
                  ? 'ring-2 ring-blue-600 bg-blue-50'
                  : 'bg-white'
              } border rounded-lg p-4 text-center hover:bg-gray-50`}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  userType: 'seller'
                }));
              }}
            >
              <span className="block text-sm font-medium">Seller</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {validationErrors.lastName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={handleNext}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Next
        </button>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {validationErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {formData.userType === 'buyer' ? 'Register' : 'Next'}
        </button>
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Store Name</label>
          <input
            type="text"
            name="store.name"
            value={formData.store.name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Business Phone</label>
          <input
            type="tel"
            name="store.phone"
            value={formData.store.phone}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {validationErrors.storePhone && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.storePhone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Business Address</label>
          <input
            type="text"
            name="store.address"
            value={formData.store.address}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {validationErrors.storeAddress && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.storeAddress}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Register
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              {[1, 2, formData.userType === 'seller' ? 3 : null].filter(Boolean).map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === registrationStep
                      ? 'bg-blue-600 text-white'
                      : step < registrationStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step < registrationStep ? '✓' : step}
                </div>
              ))}
            </div>
            <div className="mt-2">
              <p className="text-sm text-center text-gray-600">
                Step {registrationStep} of {formData.userType === 'buyer' ? '2' : '3'}
              </p>
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {registrationStep === 1 && renderStep1()}
            {registrationStep === 2 && renderStep2()}
            {registrationStep === 3 && renderStep3()}
          </form>

          {validationErrors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{validationErrors.submit}</p>
            </div>
          )}
        </div>
      </div>

      {renderStatusMessage()}
    </div>
  );
};

export default Register;
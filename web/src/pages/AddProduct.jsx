import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createProductWithNFT } from '../store/slices/productsSlice';
import { getProfile } from '../store/slices/authSlice';
import ipfsService from '../services/ipfs';

function AddProduct() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    attributes: [],
  });

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Fetch profile data if store information is missing
  useEffect(() => {
    if (user && user.role === 'seller' && !user.store) {
      dispatch(getProfile());
    }
  }, [user, dispatch]);

  // Handle seller role check
  useEffect(() => {
    if (!authLoading && user && user.role !== 'seller') {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Show loading state while auth is being checked
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Please ensure all files are images under 5MB.');
    }

    setImages(validFiles);

    // Create preview URLs
    const urls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => {
      // Revoke old URLs
      prev.forEach(url => URL.revokeObjectURL(url));
      return urls;
    });
  };

  const handleAttributeChange = (index, field, value) => {
    setFormData(prev => {
      const newAttributes = [...prev.attributes];
      newAttributes[index] = {
        ...newAttributes[index],
        [field]: value
      };
      return {
        ...prev,
        attributes: newAttributes
      };
    });
  };

  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { name: '', value: '' }]
    }));
  };

  const removeAttribute = (index) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      if (images.length === 0) {
        throw new Error('At least one product image is required.');
      }

      // 1. Upload images to IPFS with retries
      setUploadProgress(10);
      const maxRetries = 3;
      const uploadWithRetry = async (image, index) => {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const result = await ipfsService.uploadFile(image);
            setUploadProgress(prev => prev + ((80 / images.length) * (index + 1)));
            return result;
          } catch (error) {
            lastError = error;
            console.warn(`Upload attempt ${attempt + 1} failed for image ${index + 1}:`, error);
            if (attempt < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
            }
          }
        }
        throw new Error(`Failed to upload image ${index + 1} after ${maxRetries} attempts: ${lastError.message}`);
      };

      let ipfsResults;
      try {
        ipfsResults = await Promise.all(
          images.map((image, index) => uploadWithRetry(image, index))
        );
      } catch (uploadError) {
        throw new Error(`IPFS Upload Error: ${uploadError.message}`);
      }

      const imageUrls = ipfsResults.map(result => result.url);

      // 2. Create product with NFT
      setUploadProgress(90);
      const result = await dispatch(createProductWithNFT({
        ...formData,
        images: imageUrls,
        manufacturer: user.store?.name || '',
        attributes: formData.attributes.map(attr => ({
          trait_type: attr.name,
          value: attr.value
        }))
      })).unwrap();

      setUploadProgress(100);

      // 3. Navigate to product page
      navigate(`/products/${result.product.id}`);
    } catch (err) {
      console.error('Product creation failed:', err);
      let errorMessage = 'Failed to create product. Please try again.';
      
      if (err.message.includes('IPFS Upload Error')) {
        errorMessage = err.message;
      } else if (err.message.includes('IPFS node not properly initialized')) {
        errorMessage = 'IPFS service is not ready. Please try again in a few moments.';
      } else if (err.message.includes('Failed to generate CID')) {
        errorMessage = 'Failed to process image upload. Please try with a different image.';
      }
      
      setError(errorMessage);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-gray-600 mt-2">
          Create a new product listing with NFT authentication
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
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
                Description
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
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="home">Home & Living</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Product Images</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images
              </label>
              <input
                type="file"
                onChange={handleImageChange}
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                Accepted formats: JPEG, PNG, WebP. Max size: 5MB per image.
              </p>
            </div>

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImages(images.filter((_, i) => i !== index));
                        setPreviewUrls(previewUrls.filter((_, i) => i !== index));
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Additional Attributes</h2>
            <button
              type="button"
              onClick={addAttribute}
              className="text-blue-600 hover:text-blue-800"
            >
              + Add Attribute
            </button>
          </div>

          <div className="space-y-4">
            {formData.attributes.map((attr, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Attribute name"
                    value={attr.name}
                    onChange={(e) => handleAttributeChange(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Attribute value"
                    value={attr.value}
                    onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Authentication</h2>
          <p className="text-gray-600 mb-4">
            An NFT will be automatically minted for this product upon creation, and a secure hologram
            label will be generated for physical authentication.
          </p>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div
                  style={{ width: `${uploadProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                ></div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 bg-blue-600 text-white rounded-md ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
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
                Creating Product...
              </span>
            ) : (
              'Create Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;
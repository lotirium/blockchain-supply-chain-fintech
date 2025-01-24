import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, selectLoading } from '../store/slices/productsSlice';
import { getStore } from '../services/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

function AddProduct() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loading = useSelector(selectLoading);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'electronics', // Default category
  });
  const [selectedImages, setSelectedImages] = useState([]);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setIsLoading(true);
        const storeData = await getStore();
        setStore(storeData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch store information. Please try again.');
        console.error('Store fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStore();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!store) {
      setError('Store information not available. Please try again.');
      return;
    }

    try {
      // Validate images
      if (selectedImages.length === 0) {
        setError('Please select at least one image for the product');
        return;
      }

      // Create FormData with required fields
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('price', parseFloat(formData.price));
      formDataToSend.append('stock', parseInt(formData.stock));
      formDataToSend.append('category', formData.category);
      formDataToSend.append('attributes', JSON.stringify([]));
      
      // Append each selected image to FormData
      selectedImages.forEach((image) => {
        formDataToSend.append('images', image);
      });

      const result = await dispatch(createProduct({ formData: formDataToSend })).unwrap();
      navigate(`/products/${result.product.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create product. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Add New Product</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
          {error}
        </div>
      ) : !store ? (
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-md mb-4">
          Store information not available. Please try again later.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg shadow-sm p-6">
        <div>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Product Name"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description"
            required
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="Price"
            required
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />

          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleInputChange}
            placeholder="Stock Quantity"
            required
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
        >
          <option value="electronics">Electronics</option>
          <option value="fashion">Fashion</option>
          <option value="home">Home & Living</option>
        </select>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images (Max 5)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files);
              if (files.length > 5) {
                setError('Maximum 5 images allowed');
                return;
              }
              setSelectedImages(files);
              setError(null);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <p className="mt-1 text-sm text-gray-500">
            Accepted formats: JPEG, PNG, WebP. Max size: 25MB per image
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 text-white rounded-md ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Creating...' : 'Create Product'}
        </button>
      </form>
      )}
    </div>
  );
}

export default AddProduct;
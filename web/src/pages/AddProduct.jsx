import React, { useState, useEffect } from 'react';
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
  const sampleProducts = [
    {
      name: "Smart LED TV 55\"",
      description: "4K Ultra HD Smart LED TV with HDR and built-in streaming apps. Experience stunning picture quality and smart features.",
      price: "599.99",
      stock: "10",
      category: "electronics",
      imageFile: "tv.png"
    },
    {
      name: "Designer Leather Handbag",
      description: "Premium genuine leather handbag with gold-tone hardware. Spacious interior with multiple compartments.",
      price: "249.99",
      stock: "15",
      category: "fashion",
      imageFile: "bag.png"
    },
    {
      name: "Modern Coffee Table",
      description: "Contemporary coffee table with tempered glass top and wood base. Perfect centerpiece for any living room.",
      price: "179.99",
      stock: "8",
      category: "home",
      imageFile: "coffee_table.png"
    },
    {
      name: "Wireless Noise-Cancelling Headphones",
      description: "Premium over-ear headphones with active noise cancellation and 30-hour battery life.",
      price: "199.99",
      stock: "20",
      category: "electronics",
      imageFile: "headphone.png"
    },
    {
      name: "Cotton Casual Dress",
      description: "Comfortable and stylish cotton dress with floral pattern. Perfect for summer days.",
      price: "59.99",
      stock: "25",
      category: "fashion",
      imageFile: "dress.png"
    },
    {
      name: "Smart Home Security Camera",
      description: "1080p HD security camera with night vision, two-way audio, and motion detection.",
      price: "79.99",
      stock: "30",
      category: "electronics",
      imageFile: "camera.png"
    },
    {
      name: "Luxury Watch Collection",
      description: "Elegant stainless steel watch with genuine leather strap. Water-resistant up to 50m.",
      price: "299.99",
      stock: "12",
      category: "fashion",
      imageFile: "watch.png"
    },
    {
      name: "Ergonomic Office Chair",
      description: "Adjustable office chair with lumbar support and breathable mesh back. Ideal for long work hours.",
      price: "189.99",
      stock: "18",
      category: "home",
      imageFile: "chair.png"
    },
    {
      name: "Portable Bluetooth Speaker",
      description: "Waterproof portable speaker with 360° sound and 20-hour battery life. Perfect for outdoor activities.",
      price: "89.99",
      stock: "40",
      category: "electronics",
      imageFile: "speaker.png"
    },
    {
      name: "Decorative Wall Art Set",
      description: "Set of 3 modern canvas prints. Add a touch of elegance to any room with these abstract designs.",
      price: "129.99",
      stock: "15",
      category: "home",
      imageFile: "wall_art.png"
    }
  ];
  

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'electronics',
  });
  
  const [selectedImages, setSelectedImages] = useState([]);

  const createFileFromPath = async (filename) => {
    try {
      const response = await fetch(`${API_URL}/uploads/products/${filename}`);
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error('Error loading image:', error);
      return null;
    }
  };

  const handleFillSample = async () => {
    const randomProduct = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
    setFormData(randomProduct);
    
    try {
      const file = await createFileFromPath(randomProduct.imageFile);
      if (file) {
        setSelectedImages([file]);
        setError(null);
      }
    } catch (err) {
      console.error('Error setting sample image:', err);
    }
  };

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
      if (selectedImages.length === 0) {
        setError('Please select at least one image for the product');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('price', parseFloat(formData.price));
      formDataToSend.append('stock', parseInt(formData.stock));
      formDataToSend.append('category', formData.category);
      formDataToSend.append('attributes', JSON.stringify([]));
      
      selectedImages.forEach((image) => {
        formDataToSend.append('images', image);
      });

      await dispatch(createProduct({ formData: formDataToSend })).unwrap();
      navigate('/seller-products');
    } catch (err) {
      setError(err.message || 'Failed to create product. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Add New Product</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
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
        <>
          <div className="mb-6 text-right">
            <button
              type="button"
              onClick={handleFillSample}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors duration-200 flex items-center space-x-1 ml-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Fill Sample Data</span>
            </button>
          </div>
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
        </>
      )}
    </div>
  );
}

export default AddProduct;
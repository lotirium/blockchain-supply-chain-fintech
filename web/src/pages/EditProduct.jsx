import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStore } from '../services/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.4:3001';

function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [store, setStore] = useState(null);
  const [product, setProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'electronics',
    status: 'active'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch store and product data in parallel
        const [storeData, productResponse] = await Promise.all([
          getStore(),
          fetch(`${API_URL}/api/products/detail/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);

        if (!productResponse.ok) {
          throw new Error('Failed to fetch product');
        }

        const productData = await productResponse.json();
        console.log('Fetched product data:', productData);
        if (!productData.name || !productData.price) {
          console.error('Invalid product data received:', productData);
          throw new Error('Invalid product data received from server');
        }
        
        setStore(storeData);
        setProduct(productData);
        setFormData({
          name: productData.name,
          description: productData.description,
          price: productData.price.toString(),
          stock: productData.stock.toString(),
          category: productData.category,
          status: productData.status
        });
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
    setLoading(true);

    try {
      if (!store) {
        throw new Error('Store information not available');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Log request body for debugging
      const requestBody = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.stock),
        category: formData.category,
        status: formData.status
      };
      console.log('Update request body:', requestBody);

      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();
      console.log('Update response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update product');
      }

      // Navigate back to seller products page
      navigate('/seller-products');
    } catch (err) {
      setError(err.message || 'Failed to update product');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/seller-products')}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Products
        </button>
      </div>
    );
  }

  if (!product || !store) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-md mb-4">
          Product or store information not available
        </div>
        <button
          onClick={() => navigate('/seller-products')}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <button
          onClick={() => navigate('/seller-products')}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Products
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

        <div className="grid grid-cols-2 gap-4">
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

          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="sold_out">Out of Stock</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 text-white rounded-md ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Updating...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
}

export default EditProduct;
import express from 'express';
import { Store } from '../models/index.mjs';
import auth, { requireSeller } from '../middleware/auth.mjs';
import { generateHologramLabel } from '../services/imageService.mjs';

const router = express.Router();

// Get store information for the authenticated user
router.get('/', requireSeller, async (req, res) => {
  try {
    console.log('GET store request for user:', req.user.id);

    const store = await Store.findOne({
      where: {
        user_id: req.user.id
      },
      attributes: {
        exclude: ['payment_details', 'private_key']
      }
    });
    
    if (!store) {
      console.log('Store not found for user:', req.user.id);
      return res.status(404).json({ error: 'Store not found' });
    }

    // Log what we're sending back
    console.log('Sending store data:', store.toJSON());
    
    res.json(store);
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Failed to fetch store information' });
  }
});

// Update store information
router.put('/', requireSeller, async (req, res) => {
  try {
    console.log('PUT store request for user:', req.user.id);
    console.log('Full request body:', req.body);

    // Get store data from either req.body.store or req.body
    const storeData = req.body.store || req.body;
    console.log('Store data to process:', storeData);

    if (!storeData) {
      return res.status(400).json({ error: 'No store data provided' });
    }

    const {
      name,
      description,
      business_email,
      business_phone,
      business_address,
      shipping_policy,
      return_policy,
      type,
      logo,
      banner,
      hologram_label,
      wallet_address,
      is_verified,
      rating,
      total_sales,
      total_products,
      total_orders
    } = storeData;

    // Validate required fields
    if (!name || !business_email || !business_phone || !business_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let store = await Store.findOne({ where: { user_id: req.user.id } });
    
    if (!store) {
      store = await Store.create({
        user_id: req.user.id,
        status: 'active'
      });
    }

    // Get current store data to preserve existing values
    const currentData = store.toJSON();
    console.log('Current store data:', currentData);

    // Prepare update data, preserving existing values if not provided in request
    const updateData = {
      name: name || currentData.name,
      description: description || currentData.description,
      business_email: business_email || currentData.business_email,
      business_phone: business_phone || currentData.business_phone,
      business_address: business_address || currentData.business_address,
      shipping_policy: shipping_policy !== undefined ? shipping_policy : currentData.shipping_policy,
      return_policy: return_policy !== undefined ? return_policy : currentData.return_policy,
      type: type || currentData.type,
      logo: logo !== undefined ? logo : currentData.logo,
      banner: banner !== undefined ? banner : currentData.banner,
      hologram_label: hologram_label !== undefined ? hologram_label : currentData.hologram_label,
      is_verified: is_verified !== undefined ? is_verified : currentData.is_verified,
      wallet_address: wallet_address || currentData.wallet_address,
      rating: rating !== undefined ? rating : currentData.rating,
      total_sales: total_sales !== undefined ? total_sales : currentData.total_sales,
      total_products: total_products !== undefined ? total_products : currentData.total_products,
      total_orders: total_orders !== undefined ? total_orders : currentData.total_orders,
      status: 'active'
    };

    console.log('Updating store with:', updateData);

    await store.update(updateData);

    // Fetch the complete updated store to return
    const updatedStore = await Store.findOne({
      where: { user_id: req.user.id },
      attributes: { exclude: ['payment_details', 'private_key'] }
    });

    console.log('Sending updated store:', updatedStore.toJSON());
    res.json(updatedStore);
  } catch (error) {
    console.error('Update store error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to update store information' });
  }
});

// Generate hologram label
router.post('/hologram', requireSeller, async (req, res) => {
  try {
    const store = await Store.findOne({ where: { user_id: req.user.id } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Generate hologram using the image service
    const hologramPath = await generateHologramLabel(store.name);
    
    await store.update({
      hologram_label: hologramPath
    });
    
    // Fetch the updated store to ensure we have all fields
    const updatedStore = await Store.findOne({
      where: { user_id: req.user.id },
      attributes: { exclude: ['payment_details', 'private_key'] }
    });

    console.log('Sending updated store after hologram:', updatedStore.toJSON());
    res.json({
      message: 'Hologram label generated successfully',
      store: updatedStore
    });
  } catch (error) {
    console.error('Generate hologram error:', error);
    res.status(500).json({ error: 'Failed to generate hologram label' });
  }
});

router.put('/setup', auth, async (req, res) => {
  try {
    console.log('Setup request for user:', req.user.id);
    console.log('Setup request body:', req.body);

    const store = await Store.findOne({ where: { user_id: req.user.id } });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    
    const { business_email, business_address, business_phone } = req.body;
    if (!business_email || !business_address || !business_phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await store.update({
      business_email,
      business_address,
      business_phone,
      status: 'active'
    });
    
    // Fetch and return the complete updated store
    const updatedStore = await Store.findOne({
      where: { user_id: req.user.id },
      attributes: { exclude: ['payment_details', 'private_key'] }
    });

    console.log('Sending updated store after setup:', updatedStore.toJSON());
    res.json(updatedStore);
  } catch (error) {
    console.error('Setup store error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

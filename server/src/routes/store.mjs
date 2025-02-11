import express from 'express';
import { Store } from '../models/index.mjs';
import auth, { requireSeller } from '../middleware/auth.mjs';

const router = express.Router();

// Get store information for the authenticated user
router.get('/', requireSeller, async (req, res) => {
  try {
    const store = await Store.findOne({
      where: {
        user_id: req.user.id
      },
      attributes: {
        exclude: ['payment_details', 'private_key']
      }
    });
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    res.json(store);
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Failed to fetch store information' });
  }
});

// Update store information
router.put('/', requireSeller, async (req, res) => {
  try {
    const {
      name,
      description,
      business_email,
      business_phone,
      business_address,
      shipping_policy,
      return_policy
    } = req.body.store || {};

    // Validate required fields
    if (!name || !business_email || !business_phone || !business_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [store] = await Store.findOrCreate({
      where: { user_id: req.user.id },
      defaults: {
        user_id: req.user.id,
        status: 'active'
      }
    });

    // Note: wallet_address and private_key cannot be updated after creation
    await store.update({
      name,
      description,
      business_email,
      business_phone,
      business_address,
      shipping_policy,
      return_policy,
      status: 'active'
    });

    res.json(store);
  } catch (error) {
    console.error('Update store error:', error);
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

    // Simulate hologram generation with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Use mock hologram image
    const hologramPath = '/uploads/holograms/mock.jpg';
    
    await store.update({
      hologram_label: hologramPath
    });
    
    // Fetch the updated store to ensure we have all fields
    const updatedStore = await Store.findOne({ where: { user_id: req.user.id } });

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
    
    res.json(store);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

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
      wallet_address,
      shipping_policy,
      return_policy
    } = req.body.store || {};

    // Validate required fields
    if (!name || !business_email || !business_phone || !business_address || !wallet_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [store] = await Store.findOrCreate({
      where: { user_id: req.user.id },
      defaults: {
        user_id: req.user.id,
        status: 'active'
      }
    });

    await store.update({
      name,
      description,
      business_email,
      business_phone,
      business_address,
      wallet_address,
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

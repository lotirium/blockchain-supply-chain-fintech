import express from 'express';
import auth from '../middleware/auth.mjs';
import { User } from '../models/index.mjs';

const router = express.Router();

// Get all customers (users with type 'buyer')
router.get('/', auth(['admin', 'seller']), async (req, res) => {
  try {
    const customers = await User.findAll({
      where: {
        type: 'buyer'
      },
      attributes: ['id', 'user_name', 'first_name', 'last_name', 'email', 'is_email_verified', 'last_login'],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers'
    });
  }
});

// Get customer by ID
router.get('/:id', auth(['admin', 'seller']), async (req, res) => {
  try {
    const customer = await User.findOne({
      where: {
        id: req.params.id,
        type: 'buyer'
      },
      attributes: ['id', 'user_name', 'first_name', 'last_name', 'email', 'is_email_verified', 'last_login']
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer details'
    });
  }
});

export default router;
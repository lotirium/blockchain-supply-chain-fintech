import Store from '../models/Store.mjs';
import { User, Notification } from '../models/index.mjs';
import { Op } from 'sequelize';

// Helper function to validate UUID
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Admin endpoints
export const getPendingVerifications = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all stores with pending verification
    const stores = await Store.findAll({
      where: {
        status: 'pending_verification',
        is_verified: false
      },
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'email', 'user_name']
      }],
      order: [['created_at', 'ASC']]
    });

    res.json({ stores });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({ message: 'Failed to fetch pending verifications' });
  }
};

export const updateVerificationStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { storeId } = req.params;
    const { status, message } = req.body;

    // Validate storeId is a valid UUID
    if (!isValidUUID(storeId)) {
      return res.status(400).json({ message: 'Invalid store ID format' });
    }

    // Validate status and map to valid enum values
    let storeStatus;
    if (status === 'active') {
      storeStatus = 'active';
    } else if (status === 'rejected') {
      storeStatus = 'suspended';
    } else {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find store
    const store = await Store.findByPk(storeId, {
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'email']
      }]
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Update store status
    await store.update({
      status: storeStatus,
      is_verified: storeStatus === 'active',
      verification_date: storeStatus === 'active' ? new Date() : null
    });

    // Create notification for store owner
    if (store.owner) {
      await Notification.create({
        user_id: store.owner.id,
        title: status === 'active' ? 'Store Verification' : 'Store Verification Failed',
        message: message || (status === 'active'
          ? 'Your store has been verified and activated!'
          : 'Your store verification was not approved.'),
        is_read: false,
        priority: 1,
        data: {
          storeId,
          status,
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json({
      message: 'Store verification status updated',
      store: {
        id: store.id,
        status: store.status,
        is_verified: store.is_verified
      }
    });
  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({ message: 'Failed to update verification status' });
  }
};

export const getVerificationStatus = async (req, res) => {
  try {
    const store = await Store.findOne({
      where: { user_id: req.user.id },
      attributes: [
        'id', 'status', 'is_verified', 'verification_date',
        'name', 'business_email', 'business_phone', 'business_address'
      ]
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Get notifications
    const notifications = await Notification.findAll({
      where: {
        user_id: req.user.id,
        is_read: false
      },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    const steps = determineVerificationSteps(store);
    const estimatedTime = calculateEstimatedTime(store.status);

    res.json({
      status: store.status,
      estimatedTime,
      lastUpdated: store.updated_at,
      completedSteps: steps.completed,
      pendingSteps: steps.pending,
      notifications: notifications.map(n => ({
        id: n.id,
        message: n.message,
        timestamp: n.created_at
      })),
      supportEmail: process.env.SUPPORT_EMAIL || 'support@marketplace.com'
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ error: 'Failed to fetch verification status' });
  }
};

// Admin customer management endpoints
export const getCustomers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const customers = await User.findAll({
      where: {
        type: 'buyer'
      },
      attributes: ['id', 'user_name', 'first_name', 'last_name', 'email', 'is_email_verified', 'last_login'],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers'
    });
  }
};

export const verifyCustomerEmail = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { userId } = req.params;
    
    const user = await User.findOne({
      where: {
        id: userId,
        type: 'buyer'
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await user.update({ is_email_verified: true });

    // Create notification
    await Notification.create({
      user_id: user.id,
      title: 'Email Verification',
      message: 'Your email has been verified by an administrator.',
      is_read: false,
      priority: 1,
      data: {
        verifiedAt: new Date().toISOString(),
        verifiedBy: req.user.id
      }
    });

    res.json({
      success: true,
      message: 'Customer email verified successfully'
    });
  } catch (error) {
    console.error('Error verifying customer email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify customer email'
    });
  }
};

const VERIFICATION_STEPS = {
  ACCOUNT_CREATION: {
    id: 'account_creation',
    title: 'Account Creation',
    description: 'Basic seller account created successfully'
  },
  STORE_INFORMATION: {
    id: 'store_information',
    title: 'Store Information',
    description: 'Store details submitted for review'
  },
  DOCUMENT_VERIFICATION: {
    id: 'document_verification',
    title: 'Document Verification',
    description: 'Our team is reviewing your submitted documents'
  },
  FINAL_APPROVAL: {
    id: 'final_approval',
    title: 'Final Approval',
    description: 'Awaiting final verification approval'
  }
};

const determineVerificationSteps = (store) => {
  const completed = [];
  const pending = [];

  // Account Creation is always completed if we have a store record
  completed.push(VERIFICATION_STEPS.ACCOUNT_CREATION);

  // Store Information
  if (store.name && store.business_email && store.business_phone && store.business_address) {
    completed.push(VERIFICATION_STEPS.STORE_INFORMATION);
  } else {
    pending.push(VERIFICATION_STEPS.STORE_INFORMATION);
  }

  // Document Verification
  if (store.status === 'pending_verification') {
    completed.push(VERIFICATION_STEPS.STORE_INFORMATION);
    pending.push(VERIFICATION_STEPS.DOCUMENT_VERIFICATION);
    pending.push(VERIFICATION_STEPS.FINAL_APPROVAL);
  } else if (store.status === 'active') {
    completed.push(VERIFICATION_STEPS.STORE_INFORMATION);
    completed.push(VERIFICATION_STEPS.DOCUMENT_VERIFICATION);
    completed.push(VERIFICATION_STEPS.FINAL_APPROVAL);
  } else {
    pending.push(VERIFICATION_STEPS.DOCUMENT_VERIFICATION);
    pending.push(VERIFICATION_STEPS.FINAL_APPROVAL);
  }

  return { completed, pending };
};

const calculateEstimatedTime = (status) => {
  switch (status) {
    case 'pending':
      return '24-48 hours';
    case 'pending_verification':
      return '12-24 hours';
    case 'active':
      return 'Completed';
    case 'suspended':
      return 'Contact Support';
    default:
      return '24-48 hours';
  }
};

export default {
  getPendingVerifications,
  updateVerificationStatus,
  getVerificationStatus,
  getCustomers,
  verifyCustomerEmail
};
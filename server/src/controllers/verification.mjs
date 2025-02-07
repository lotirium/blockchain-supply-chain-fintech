import Store from '../models/Store.mjs';
import { User, Notification } from '../models/index.mjs';
import blockchainController from './blockchain.mjs';

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
        as: 'storeOwner',
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
        as: 'storeOwner',
        attributes: ['id', 'email'] // Include email for better logging
      }]
    });

    if (!store) {
      console.error(`Store not found with ID: ${storeId}`);
      return res.status(404).json({ message: 'Store not found' });
    }

    console.log('Found store:', {
      storeId: store.id,
      storeName: store.name,
      currentStatus: store.status,
      hasStoreOwner: !!store.storeOwner,
      storeOwnerData: store.storeOwner ? {
        id: store.storeOwner.id,
        email: store.storeOwner.email
      } : 'No owner data'
    });

    // Update store status and grant blockchain role if activated
    await store.update({
      status: storeStatus,
      is_verified: storeStatus === 'active',
      verification_date: storeStatus === 'active' ? new Date() : null
    });

    // If store is activated, grant seller role on blockchain
    if (storeStatus === 'active' && store.wallet_address) {
      try {
        await blockchainController.grantSellerRole(store.wallet_address);
        store.blockchain_verification_date = new Date();
        await store.save();
      } catch (blockchainError) {
        console.error('Failed to grant seller role on blockchain:', blockchainError);
        // Don't fail the whole request if blockchain update fails
        // We'll retry during the periodic blockchain sync
      }
    }

    // Check if store owner exists
    if (!store.storeOwner) {
      console.error('Store owner not found for store:', store.id);
      return res.status(500).json({ message: 'Store owner data not found' });
    }

    // Create notification for store owner
    try {
      await Notification.create({
        user_id: store.storeOwner.id,
        type: status === 'active' ? 'success' : 'error',
        message: message || (status === 'active'
          ? 'Your store has been verified and activated!'
          : 'Your store verification was not approved.'),
        read: false
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the whole request if notification creation fails
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
      return res.status(404).json({
        error: 'Store not found'
      });
    }

    // Get any pending notifications related to verification
    const notifications = await Notification.findAll({
      where: {
        user_id: req.user.id,
        read: false
      },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // Determine completed and pending steps based on store status
    const steps = determineVerificationSteps(store);

    // Calculate estimated time based on current status
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
    res.status(500).json({
      error: 'Failed to fetch verification status'
    });
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
  getVerificationStatus,
  updateVerificationStatus,
  getPendingVerifications
};
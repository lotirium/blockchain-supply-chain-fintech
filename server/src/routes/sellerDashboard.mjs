import express from 'express';
import auth from '../middleware/auth.mjs';
import { isSeller } from '../middleware/roles.mjs';
import sellerDashboardController from '../controllers/sellerDashboard.mjs';

const router = express.Router();

// Apply authentication and seller role middleware to all routes
router.use(auth());
router.use(isSeller);

// Get dashboard data
router.get('/data', sellerDashboardController.getDashboardData);

// Get notifications
router.get('/notifications', sellerDashboardController.getNotifications);

// Mark notification as read
router.put('/notifications/:notificationId/read', sellerDashboardController.markNotificationRead);

// Mark all notifications as read
router.put('/notifications/read-all', sellerDashboardController.markAllNotificationsRead);

// Delete notification
router.delete('/notifications/:notificationId', sellerDashboardController.deleteNotification);

// Get store statistics
router.get('/stats', sellerDashboardController.getStoreStats);

export default router;
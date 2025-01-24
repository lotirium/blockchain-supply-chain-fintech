const { User, Store, sequelize } = require('../models');
const { Op } = require('sequelize');

const profileController = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [{
          model: Store,
          as: 'store',
          attributes: ['name', 'description', 'status']
        }]
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { username, email, walletAddress, storeName } = req.body;

      // Validate wallet address if provided
      if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return res.status(400).json({ message: 'Invalid wallet address format' });
      }

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await User.findOne({
          where: { email, id: { [Op.ne]: req.user.id } }
        });
        if (existingUser) {
          return res.status(400).json({ message: 'Email is already in use' });
        }
      }

      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Store,
          as: 'store'
        }],
        transaction
      });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user fields
      if (username) user.username = username;
      if (email) user.email = email;
      if (walletAddress) user.walletAddress = walletAddress;

      // Handle store updates for sellers
      if (user.role === 'seller' && storeName) {
        if (!user.store) {
          // Create new store if it doesn't exist
          user.store = await Store.create({
            userId: user.id,
            name: storeName,
            status: 'pending'
          }, { transaction });
        } else {
          // Update existing store
          user.store.name = storeName;
          await user.store.save({ transaction });
        }
      }

      await user.save({ transaction });
      await transaction.commit();

      // Fetch the updated user with store information
      const updatedUser = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] },
        include: [{
          model: Store,
          as: 'store',
          attributes: ['name', 'description', 'status']
        }]
      });

      res.json(updatedUser);
    } catch (error) {
      await transaction.rollback();
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
  }
};

module.exports = profileController;
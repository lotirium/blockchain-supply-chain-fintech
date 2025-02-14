import { User, Store } from '../src/models/index.mjs';
import { testConnection } from '../src/config/database.mjs';
import { generateWalletCredentials, setupStoreWallet } from '../src/utils/blockchainUtils.mjs';

async function createTestSeller() {
  try {
    // Test database connection
    await testConnection();
    console.log('Database connection successful');

    // Delete existing test seller if exists
    const existingUser = await User.findOne({
      where: { email: 'seller@test.com' }
    });

    if (existingUser) {
      await Store.destroy({
        where: { user_id: existingUser.id },
        force: true
      });
      await User.destroy({
        where: { id: existingUser.id },
        force: true
      });
      console.log('Cleaned up existing test seller');
    }

    // Create new seller user
    const seller = await User.create({
      user_name: 'testseller',
      email: 'seller@test.com',
      password: 'Seller123!',
      first_name: 'Test',
      last_name: 'Seller',
      role: 'seller',
      type: 'seller',
      is_email_verified: true,
      status: 'active'
    });

    // Generate wallet credentials
    const { address, privateKey } = generateWalletCredentials();

    // Create store for the seller
    const store = await Store.create({
      name: 'Test Store',
      description: 'A test store for development',
      user_id: seller.id,
      business_email: seller.email,
      business_phone: '1234567890',
      business_address: '123 Test St',
      status: 'active',
      is_verified: true,
      type: 'retailer',
      wallet_address: address,
      private_key: privateKey
    });

    // Setup wallet in environment for blockchain operations
    await setupStoreWallet(address, privateKey);
    console.log('Store wallet credentials saved');

    console.log('Test seller account created successfully');
    console.log('User ID:', seller.id);
    console.log('Store ID:', store.id);
    console.log('Email: seller@test.com');
    console.log('Password: Seller123!');
    console.log('Store wallet address:', address);
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to create test seller:', error);
    process.exit(1);
  }
}

createTestSeller();
import { User, Store } from '../src/models/index.mjs';
import { testConnection } from '../src/config/database.mjs';
import { ethers } from 'ethers';
import blockchainController from '../src/controllers/blockchain.mjs';
import dotenv from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function createTestSeller() {
    // Generate a new wallet for the store
    const wallet = ethers.Wallet.createRandom();
    console.log('Generated new wallet:', {
        address: wallet.address,
        privateKey: wallet.privateKey
    });

    // Initialize blockchain controller
    await blockchainController.initialize();
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

        // Create store for the seller with wallet information
        const store = await Store.create({
            name: 'Test Store',
            description: 'A test store for development',
            user_id: seller.id,
            business_email: seller.email,
            business_phone: '1234567890',
            business_address: '123 Test St',
            status: 'active',
            is_verified: true,
            type: 'seller',
            wallet_address: wallet.address,
            private_key: wallet.privateKey.slice(2) // Remove '0x' prefix to match validation
        });

        console.log('Store created, attempting to grant blockchain role...');
        
        // Grant seller role on blockchain
        try {
            console.log('Granting seller role...');
            const result = await blockchainController.grantSellerRole(wallet.address);
            console.log('Granted seller role to wallet:', result);
        } catch (error) {
            console.error('Failed to grant blockchain role:', error);
            throw error; // Re-throw to trigger the outer catch block
        }

        console.log('Test seller account created successfully');
        console.log('User ID:', seller.id);
        console.log('Store ID:', store.id);
        console.log('Email: seller@test.com');
        console.log('Password: Seller123!');
        console.log('Store Type:', store.type);
        console.log('Store Wallet Address:', wallet.address);

        process.exit(0);
    } catch (error) {
        console.error('Failed to create test seller:', error);
        process.exit(1);
    }
}

createTestSeller();
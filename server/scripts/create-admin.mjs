import { User } from '../src/models/index.mjs';
import { testConnection } from '../src/config/database.mjs';

async function createAdmin() {
  try {
    // Test database connection
    await testConnection();
    console.log('Database connection successful');

    // Check if admin user exists
    const existing = await User.findOne({ where: { email: 'admin@marketplace.com' }, paranoid: false });
    if (existing) {
      console.log('Admin user already exists.');
      console.log('ID:', existing.id);
      console.log('Email:', existing.email);
      return process.exit(0);
    }

    // Create new admin user
    const admin = await User.create({
      user_name: 'admin',
      email: 'admin@marketplace.com',
      password: 'Admin123!',
      role: 'admin',
      type: 'admin',
      is_email_verified: true
    });

    console.log('Admin user created successfully');
    console.log('ID:', admin.id);
    console.log('Email:', admin.email);
    console.log('Password: Admin123!');
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin user:', error.message);
    process.exit(1);
  }
}

createAdmin();
import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sequelize from '../config/database.mjs';

class User extends Model {
  // Instance methods
  async comparePassword(candidatePassword) {
    console.log('Comparing passwords...');
    console.log('Stored password hash:', this.password);
    console.log('Candidate password length:', candidatePassword?.length || 0);
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password match result:', isMatch);
    
    return isMatch;
  }

  generateAuthToken() {
    return jwt.sign(
      { id: this.id, role: this.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );
  }

  async getDecryptedPrivateKey() {
    if (!this.encrypted_private_key) {
      throw new Error('No private key found');
    }

    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
    const iv = Buffer.from(this.iv, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(this.encrypted_private_key, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async setEncryptedPrivateKey(privateKey) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    this.encrypted_private_key = encrypted;
    this.iv = iv.toString('hex');
  }

  toJSON() {
    const values = { ...this.get() };
    // Remove sensitive data
    delete values.password;
    delete values.encrypted_private_key;
    delete values.iv;

    // Ensure store data is properly included if it exists
    if (this.ownedStore) {
      values.ownedStore = this.ownedStore.get();
    }

    return values;
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'seller', 'admin'),
    defaultValue: 'user'
  },
  wallet_address: {
    type: DataTypes.STRING,
    validate: {
      isEthereumAddress(value) {
        if (value && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
          throw new Error('Invalid Ethereum address');
        }
      }
    }
  },
  encrypted_private_key: {
    type: DataTypes.TEXT
  },
  iv: {
    type: DataTypes.STRING
  },
  is_email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_login: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

export default User;
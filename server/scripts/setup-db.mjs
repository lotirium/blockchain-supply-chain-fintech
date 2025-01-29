import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '5432',
} = process.env;

async function setupDatabase() {
  try {
    console.log('Starting database setup...');
    
    // Execute the SQL file as postgres superuser using sudo
    const sqlFile = path.join(__dirname, 'setup-db.sql');
    const command = `sudo -u postgres psql -f "${sqlFile}"`;
    
    console.log('Executing SQL script...');
    const { stdout, stderr } = await execPromise(command);
    
    if (stdout) console.log('Output:', stdout);
    if (stderr) console.error('Errors:', stderr);
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 'http://localhost:5001';

export async function generateHologramLabel(storeName) {
  try {
    console.log(`Calling image service for store: ${storeName}`);
    const response = await fetch(`${IMAGE_SERVICE_URL}/generate-hologram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ store_name: storeName }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Image service error: ${response.status} - ${responseText}`);
    }

    const data = await response.json();
    
    if (!data.image) {
      throw new Error('No image data received from service');
    }

    // Decode base64 content
    const buffer = Buffer.from(data.image, 'base64');
    
    // Create unique filename with .png extension
    const filename = `hologram_${Date.now()}.png`;
    
    // Use __dirname to get the correct path relative to this file
    // Go up two levels from src/services to get to the server root
    const serverRoot = path.resolve(__dirname, '../../');
    const uploadDir = path.join(serverRoot, 'uploads', 'holograms');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filepath = path.join(uploadDir, filename);
    
    // Write the file synchronously
    fs.writeFileSync(filepath, buffer);
    
    console.log(`Hologram saved to: ${filepath}`);
    
    // Return relative path for database storage and frontend access
    // This path should match the static file serving configuration in Express
    return `/uploads/holograms/${filename}`;
  } catch (error) {
    console.error('Error in generateHologramLabel:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}
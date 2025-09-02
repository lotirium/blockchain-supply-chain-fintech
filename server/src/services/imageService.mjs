import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 'http://192.168.0.4:8000';

/**
 * Generates a UV-sensitive hologram label for a specific product
 * The hologram includes:
 * - Product-specific information
 * - NFT token ID (embedded in UV-only visible layer)
 * - Store verification data
 * - AI-verifiable patterns
 * 
 * This hologram is designed to be verified using a specialized UV magnifying glass
 * with built-in AI verification capabilities.
 * 
 * The UV pattern includes:
 * 1. Micro QR code containing tokenId (UV-visible only)
 * 2. Guilloché patterns with embedded product data
 * 3. AI-recognizable geometric markers
 * 4. Steganographic data layer
 * 
 * @param {string} storeName - Name of the store
 * @param {string} productId - Unique identifier of the product
 * @param {string} tokenId - NFT token ID associated with the product
 * @param {Object} productDetails - Additional product details for hologram generation
 * @returns {Promise<string>} Path to the generated hologram image
 */
export async function generateProductHologram({
  productId,
  tokenId,
  productName,
  manufacturer,
  orderId,
  verificationCode,
  storeName,
  uvData
}) {
  try {
    // Generate unique verification seed from product and order data
    const verificationSeed = crypto
      .createHash('sha256')
      .update(`${productId}-${tokenId}-${orderId}-${verificationCode}`)
      .digest('hex');

    // Create a compact version of UV data for steganography
    const compactData = {
      t: tokenId || 'pending',              // token ID
      v: verificationCode.substring(0, 16),  // first 16 chars of verification code
      ts: Date.now()                        // timestamp as number
    };

    console.log(`Generating UV hologram for product ${productName} (${productId}) with NFT token ${tokenId}`);
    const response = await fetch(`${IMAGE_SERVICE_URL}/generate-product-hologram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        store_name: storeName,
        product_id: productId,
        nft_token_id: tokenId || 'pending',  // Ensure token ID is passed correctly
        product_details: {
          name: productName,
          manufacturer,
          orderId,
          verificationCode
        },
        security_features: {
          uv_layer: true,
          ai_verification_pattern: true,
          nft_verification: true
        },
        hologram_config: {
          // UV-sensitive pattern configuration
          uv_patterns: {
            qr_code: {
              data: JSON.stringify(uvData),  // Full data in QR code
              error_correction: 'H',
              size: 256
            },
            guilloche: {
              complexity: 'high',
              data_encoding: true,
              seed: (parseInt(verificationSeed.substring(0, 8), 16) % (2**32 - 1)).toString()
            },
            geometric_markers: {
              pattern: 'hexagonal',
              count: 6,
              rotation: parseInt(verificationSeed.substring(16, 18), 16)
            }
          },
          // Steganographic layer configuration
          steganography: {
            method: 'dct', // Discrete Cosine Transform
            data: JSON.stringify(compactData), // Use compact data for steganography
            strength: 0.7
          },
          // AI verification features
          ai_features: {
            pattern_type: 'neural',
            complexity: 'high',
            verification_markers: [
              'corner_detection',
              'pattern_recognition',
              'color_analysis'
            ]
          }
        }
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Image service error: ${response.status} - ${responseText}`);
    }

    const data = await response.json();
    
    // Validate response data
    if (!data.image || !data.size || !data.mode || !data.format) {
      throw new Error('Invalid response data from image service');
    }

    // Validate image properties
    if (!['RGB', 'RGBA'].includes(data.mode) || data.format !== 'PNG') {
      throw new Error(`Invalid image format: mode=${data.mode}, format=${data.format}`);
    }

    if (data.size[0] < 100 || data.size[1] < 100) {
      throw new Error(`Image too small: ${data.size[0]}x${data.size[1]}`);
    }

    // Decode and validate base64 content
    let buffer;
    try {
      buffer = Buffer.from(data.image, 'base64');
      if (buffer.length === 0) {
        throw new Error('Empty image buffer');
      }
    } catch (decodeError) {
      throw new Error(`Failed to decode image data: ${decodeError.message}`);
    }
    
    try {
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
    } catch (fileError) {
      throw new Error(`Failed to save hologram file: ${fileError.message}`);
    }
  } catch (error) {
    console.error('Error generating product hologram:', error);
    console.error('Stack trace:', error.stack);
    throw new Error(`Failed to generate UV hologram for product ${productId}: ${error.message}`);
  }
}
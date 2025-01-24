// Import polyfill before any other imports
import '../utils/customEventPolyfill.mjs';

import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { promises as fs } from 'fs';
import path from 'path';

class IPFSService {
  constructor() {
    this.helia = null;
    this.fs = null;
    this.isInitialized = false;
    this.gatewayUrl = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/';
    this.bootstrapNodes = [
      '/dnsaddr/ipfs.io/p2p/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd',
      '/dnsaddr/ipfs.io/p2p/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3'
    ];
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create libp2p node
      const libp2p = await createLibp2p({
        transports: [webSockets()],
        connectionEncryption: [noise()],
        streamMuxers: [yamux()],
        peerDiscovery: [
          bootstrap({
            list: this.bootstrapNodes
          })
        ]
      });

      // Create Helia node
      this.helia = await createHelia({
        libp2p
      });

      // Create UnixFS instance
      this.fs = unixfs(this.helia);

      this.isInitialized = true;
      console.log('IPFS service initialized with ID:', this.helia.libp2p.peerId.toString());
    } catch (error) {
      console.error('Failed to initialize IPFS service:', error);
      throw new Error('Failed to initialize IPFS service');
    }
  }

  async uploadFile(filePath) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const content = await fs.readFile(filePath);
      const cid = await this.fs.addBytes(content);
      
      // Remove the file after successful upload
      await fs.unlink(filePath);

      return {
        cid: cid.toString(),
        url: `${this.gatewayUrl}${cid.toString()}`
      };
    } catch (error) {
      console.error('Failed to upload file to IPFS:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  async uploadContent(content) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Convert content to Uint8Array if it's a string
      const data = typeof content === 'string' 
        ? uint8ArrayFromString(content)
        : content;

      const cid = await this.fs.addBytes(data);
      
      return {
        cid: cid.toString(),
        url: `${this.gatewayUrl}${cid.toString()}`
      };
    } catch (error) {
      console.error('Failed to upload content to IPFS:', error);
      throw new Error('Failed to upload content to IPFS');
    }
  }

  async uploadFiles(files) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const content = await fs.readFile(file.path);
          const cid = await this.fs.addBytes(content);
          
          // Remove the file after successful upload
          await fs.unlink(file.path);

          return {
            originalName: file.originalname,
            cid: cid.toString(),
            url: `${this.gatewayUrl}${cid.toString()}`
          };
        })
      );

      return results;
    } catch (error) {
      console.error('Failed to upload files to IPFS:', error);
      throw new Error('Failed to upload files to IPFS');
    }
  }

  async getContent(cid) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const chunks = [];
      for await (const chunk of this.fs.cat(cid)) {
        chunks.push(chunk);
      }

      return uint8ArrayToString(
        chunks.reduce((acc, chunk) => {
          const combined = new Uint8Array(acc.length + chunk.length);
          combined.set(acc);
          combined.set(chunk, acc.length);
          return combined;
        }, new Uint8Array(0))
      );
    } catch (error) {
      console.error('Failed to get content from IPFS:', error);
      throw new Error('Failed to get content from IPFS');
    }
  }

  async pin(cid) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.helia.pins.add(cid);
      return true;
    } catch (error) {
      console.error('Failed to pin content:', error);
      throw new Error('Failed to pin content');
    }
  }

  async unpin(cid) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.helia.pins.rm(cid);
      return true;
    } catch (error) {
      console.error('Failed to unpin content:', error);
      throw new Error('Failed to unpin content');
    }
  }

  getGatewayUrl(cid) {
    return `${this.gatewayUrl}${cid}`;
  }

  async validateConfig() {
    const requiredEnvVars = [
      'IPFS_GATEWAY_URL'
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
      throw new Error(`Missing required IPFS configuration: ${missing.join(', ')}`);
    }

    try {
      await this.initialize();
      return true;
    } catch (error) {
      throw new Error('Failed to validate IPFS configuration');
    }
  }

  async stop() {
    if (this.helia) {
      try {
        await this.helia.stop();
        this.helia = null;
        this.fs = null;
        this.isInitialized = false;
        console.log('IPFS service stopped');
      } catch (error) {
        console.error('Failed to stop IPFS service:', error);
        throw new Error('Failed to stop IPFS service');
      }
    }
  }
}

// Create singleton instance
const ipfsService = new IPFSService();
export default ipfsService;
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { bootstrap } from '@libp2p/bootstrap';
import { CID } from 'multiformats/cid';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';

class IPFSService {
  constructor() {
    this.helia = null;
    this.fs = null;
    this.bootstrapNodes = [
      '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
      '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
      '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
      '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
    ];
  }

  async initialize() {
    if (this.helia) {
      return;
    }

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

      console.log('IPFS node initialized with ID:', this.helia.libp2p.peerId.toString());
    } catch (error) {
      console.error('Failed to initialize IPFS node:', error);
      throw new Error('Failed to initialize IPFS node');
    }
  }

  async uploadFile(file) {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    try {
      await this.initialize();

      if (!this.helia || !this.fs) {
        throw new Error('IPFS node not properly initialized');
      }

      // Convert file to Uint8Array
      const buffer = await file.arrayBuffer();
      const content = new Uint8Array(buffer);
      
      if (!content || content.length === 0) {
        throw new Error('File content is empty');
      }

      // Add file to IPFS
      const cid = await this.fs.addBytes(content);
      
      if (!cid) {
        throw new Error('Failed to generate CID for uploaded file');
      }

      return {
        cid: cid.toString(),
        url: `ipfs://${cid.toString()}`
      };
    } catch (error) {
      console.error('Failed to upload file to IPFS:', error);
      // Preserve the original error message
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  }

  async uploadFiles(files) {
    try {
      const results = await Promise.all(
        files.map(file => this.uploadFile(file))
      );
      return results;
    } catch (error) {
      console.error('Failed to upload files to IPFS:', error);
      throw new Error('Failed to upload files to IPFS');
    }
  }

  async uploadContent(content) {
    try {
      await this.initialize();

      // Convert content to Uint8Array if it's a string
      const data = typeof content === 'string' 
        ? uint8ArrayFromString(content)
        : content;

      // Add content to IPFS
      const cid = await this.fs.addBytes(data);
      
      return {
        cid: cid.toString(),
        url: `ipfs://${cid.toString()}`
      };
    } catch (error) {
      console.error('Failed to upload content to IPFS:', error);
      throw new Error('Failed to upload content to IPFS');
    }
  }

  async getContent(cid) {
    try {
      await this.initialize();

      // Convert CID string to CID object
      const contentCID = CID.parse(cid);

      // Get content from IPFS
      const chunks = [];
      for await (const chunk of this.fs.cat(contentCID)) {
        chunks.push(chunk);
      }

      // Combine chunks and convert to string
      const content = uint8ArrayToString(
        chunks.reduce((acc, chunk) => {
          const combined = new Uint8Array(acc.length + chunk.length);
          combined.set(acc);
          combined.set(chunk, acc.length);
          return combined;
        }, new Uint8Array(0))
      );

      return content;
    } catch (error) {
      console.error('Failed to get content from IPFS:', error);
      throw new Error('Failed to get content from IPFS');
    }
  }

  async pinContent(cid) {
    try {
      await this.initialize();

      // Convert CID string to CID object
      const contentCID = CID.parse(cid);

      // Pin content
      await this.helia.pins.add(contentCID);

      return true;
    } catch (error) {
      console.error('Failed to pin content:', error);
      throw new Error('Failed to pin content');
    }
  }

  async unpinContent(cid) {
    try {
      await this.initialize();

      // Convert CID string to CID object
      const contentCID = CID.parse(cid);

      // Unpin content
      await this.helia.pins.rm(contentCID);

      return true;
    } catch (error) {
      console.error('Failed to unpin content:', error);
      throw new Error('Failed to unpin content');
    }
  }

  async isContentPinned(cid) {
    try {
      await this.initialize();

      // Convert CID string to CID object
      const contentCID = CID.parse(cid);

      // Check if content is pinned
      const pins = this.helia.pins.ls();
      for await (const pin of pins) {
        if (pin.toString() === contentCID.toString()) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to check pin status:', error);
      throw new Error('Failed to check pin status');
    }
  }

  async stop() {
    if (this.helia) {
      try {
        await this.helia.stop();
        this.helia = null;
        this.fs = null;
        console.log('IPFS node stopped');
      } catch (error) {
        console.error('Failed to stop IPFS node:', error);
        throw new Error('Failed to stop IPFS node');
      }
    }
  }
}

// Create singleton instance
const ipfsService = new IPFSService();
export default ipfsService;
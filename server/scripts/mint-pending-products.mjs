import mintPendingNFTs from '../src/jobs/mintPendingNFTs.mjs';

// Run immediately and exit
console.log('Starting one-time minting of pending NFTs...');
mintPendingNFTs()
  .then(() => {
    console.log('Completed minting pending NFTs');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error minting pending NFTs:', error);
    process.exit(1);
  });
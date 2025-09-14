const E = require('ethers');
console.log('top keys:', Object.keys(E));
if (E.default) console.log('default keys:', Object.keys(E.default));
if (E.ethers) console.log('ethers keys:', Object.keys(E.ethers).slice(0,50));
console.log('has utils top:', !!E.utils, 'has utils default:', !!(E.default && E.default.utils), 'has utils ethers:', !!(E.ethers && E.ethers.utils));

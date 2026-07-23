// Off-thread PoW mining, using the same SHA-256 (crypto-js) implementation as the main thread.
import { sha256 } from '../cryptoEngine';

self.onmessage = (e: MessageEvent) => {
  const { index, previousHash, timestamp, txHashes, difficulty } = e.data;
  const target = Array(difficulty + 1).join('0');
  let nonce = 0;
  let hash = '';

  const calculateHash = (n: number) => {
    return sha256(
      index.toString() + previousHash + timestamp.toString() + JSON.stringify(txHashes) + n.toString()
    );
  };

  while (true) {
    nonce++;
    hash = calculateHash(nonce);
    if (hash.substring(0, difficulty) === target) {
      break;
    }
    if (nonce % 10000 === 0) {
      self.postMessage({ type: 'PROGRESS', nonce });
    }
  }

  self.postMessage({ type: 'SUCCESS', nonce, hash });
};

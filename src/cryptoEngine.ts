// Real cryptographic primitives for SciBlockChain.
// SHA-256 via crypto-js, ECDSA (secp256k1) keypairs/signatures via elliptic —
// the same libraries used by production JS blockchain implementations (e.g. bitcoinjs).
import CryptoJS from 'crypto-js';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

export interface KeyPair {
  address: string;
  publicKey: string;
  privateKey: string;
}

/** SHA-256, UTF-8 safe (Korean text etc.) */
export function sha256(input: string): string {
  return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
}

/** Derive a display address from an EC public key (hex). */
export function addressFromPublicKey(publicKeyHex: string, prefix: string = '0xVisitor_'): string {
  return `${prefix}${sha256(publicKeyHex).substring(0, 8)}`;
}

export function getPublicKeyFromPrivateKey(privateKeyHex: string): string {
  return ec.keyFromPrivate(privateKeyHex, 'hex').getPublic('hex');
}

/**
 * Deterministically derives a real secp256k1 keypair from a seed string
 * (login ID, name, or RFID UID), so the same input always yields the same
 * wallet — matches the app's "same input -> same wallet" demo behavior,
 * but now backed by an actual EC keypair instead of a toy hash.
 */
export function generateCryptoKeyPair(seed: string, addressPrefix: string = '0xVisitor_'): KeyPair {
  const seedHash = sha256(`sciblockchain_priv_${seed}`);
  const key = ec.keyFromPrivate(seedHash, 'hex');
  const privateKey = key.getPrivate('hex');
  const publicKey = key.getPublic('hex');
  const address = addressFromPublicKey(publicKey, addressPrefix);

  return { address, publicKey, privateKey };
}

/** Sign a payload (e.g. a transaction id/hash) with an ECDSA private key. Returns a DER-encoded hex signature. */
export function signTransactionPayload(payload: string, privateKeyHex: string): string {
  if (!privateKeyHex) throw new Error('Private key is required for signature');
  const key = ec.keyFromPrivate(privateKeyHex, 'hex');
  const hash = sha256(payload);
  return key.sign(hash, { canonical: true }).toDER('hex');
}

/** Verify a DER-encoded hex signature against a payload and the signer's public key. */
export function verifyTransactionSignature(payload: string, signature: string, publicKeyHex: string): boolean {
  if (!signature || !publicKeyHex) return false;
  try {
    const key = ec.keyFromPublic(publicKeyHex, 'hex');
    const hash = sha256(payload);
    return key.verify(hash, signature);
  } catch {
    return false;
  }
}

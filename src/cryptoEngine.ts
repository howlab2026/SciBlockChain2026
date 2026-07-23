import { sha256 } from './blockchain';

export interface KeyPair {
  address: string;
  publicKey: string;
  privateKey: string;
}

export function generateCryptoKeyPair(name: string): KeyPair {
  let hashNum = 0;
  for (let i = 0; i < name.length; i++) {
    hashNum = ((hashNum << 5) - hashNum) + name.charCodeAt(i);
    hashNum |= 0;
  }
  const hex = Math.abs(hashNum).toString(16).padStart(8, '0').substring(0, 8);
  const pubHex = sha256(`pub_${name}_${hex}`).substring(0, 32);
  const privHex = sha256(`priv_${name}_${hex}_secret`).substring(0, 32);

  return {
    address: `0xVisitor_${hex}`,
    publicKey: `04${pubHex}`,
    privateKey: `pv_${privHex}`,
  };
}

export function signTransactionPayload(payload: string, privateKey: string): string {
  if (!privateKey) throw new Error('Private key is required for signature');
  return sha256(`SIG:${payload}:${privateKey}`);
}

export function verifyTransactionSignature(payload: string, signature: string, privateKey: string): boolean {
  if (!signature || !privateKey) return false;
  const expected = sha256(`SIG:${payload}:${privateKey}`);
  return signature === expected;
}

// Shared types for SciBlockChain application
import { generateCryptoKeyPair } from './cryptoEngine';

export interface Booth {
  id: string;
  name: string;
  description: string;
  cost: number;
  visits?: number;
  revenue?: number;
}

export interface VisitorWallet {
  /** 로그인 ID (자가 등록 시 입력, RFID의 경우 rfid_XXXXX 형태) */
  loginId: string;
  /** 로그인 비밀번호 (RFID의 경우 rfidUid와 동일) */
  password: string;
  /** RFID UID (RFID 로그인 시 사용) */
  rfidUid?: string;
  /** 표시 이름 */
  name: string;
  /** 블록체인 주소 (공개키에서 파생) */
  address: string;
  /** 트랜잭션 서명 검증용 공개키 (ECDSA secp256k1) */
  publicKey: string;
  /** 트랜잭션 서명용 개인키 (ECDSA secp256k1) */
  privateKey: string;
}

export interface ReceiptData {
  txId: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  purpose: string;
  blockIndex: number;
  timestamp: number;
  coinName: string;
}

/** 이름과 로그인 ID로 지갑 생성 (실제 ECDSA 키쌍 사용) */
export function makeWallet(name: string, loginId?: string, password?: string): VisitorWallet {
  const seed = loginId || name;
  const { address, publicKey, privateKey } = generateCryptoKeyPair(seed);
  const hex = address.replace('0xVisitor_', '');
  const resolvedId = loginId || `visitor_${hex}`;
  const resolvedPw = password || hex;
  return {
    loginId: resolvedId,
    password: resolvedPw,
    name,
    address,
    publicKey,
    privateKey,
  };
}

/** RFID UID로 지갑 생성 (실제 ECDSA 키쌍 사용) */
export function makeRfidWallet(name: string, rfidUid: string): VisitorWallet {
  const { address, publicKey, privateKey } = generateCryptoKeyPair(rfidUid);
  return {
    loginId: `rfid_${rfidUid}`,
    password: rfidUid,
    rfidUid,
    name,
    address,
    publicKey,
    privateKey,
  };
}

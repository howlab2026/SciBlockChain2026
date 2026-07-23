// Shared types for SciBlockChain application

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
  /** 블록체인 주소 */
  address: string;
  /** 트랜잭션 서명용 개인키 */
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

/** 이름과 로그인 ID로 지갑 생성 */
export function makeWallet(name: string, loginId?: string, password?: string): VisitorWallet {
  // 주소는 name 기반 해시로 생성 (고유성 보장)
  const seed = loginId || name;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h) + seed.charCodeAt(i);
    h |= 0;
  }
  const abs = Math.abs(h);
  const hex = abs.toString(16).padStart(8, '0').substring(0, 8);
  const resolvedId = loginId || `visitor_${hex}`;
  const resolvedPw = password || hex;
  return {
    loginId: resolvedId,
    password: resolvedPw,
    name,
    address: `0xVisitor_${hex}`,
    privateKey: `pv_${hex}_${Math.abs(h * 99).toString(16).substring(0, 8)}`,
  };
}

/** RFID UID로 지갑 생성 */
export function makeRfidWallet(name: string, rfidUid: string): VisitorWallet {
  let h = 0;
  for (let i = 0; i < rfidUid.length; i++) {
    h = ((h << 5) - h) + rfidUid.charCodeAt(i);
    h |= 0;
  }
  const abs = Math.abs(h);
  const hex = abs.toString(16).padStart(8, '0').substring(0, 8);
  return {
    loginId: `rfid_${rfidUid}`,
    password: rfidUid,
    rfidUid,
    name,
    address: `0xVisitor_${hex}`,
    privateKey: `pv_${hex}_${Math.abs(h * 99).toString(16).substring(0, 8)}`,
  };
}


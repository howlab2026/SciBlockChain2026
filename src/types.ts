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
  name: string;
  address: string;
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

export function makeWallet(name: string): VisitorWallet {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h) + name.charCodeAt(i);
    h |= 0;
  }
  const abs = Math.abs(h);
  const hex = abs.toString(16).padStart(8, '0').substring(0, 8);
  return {
    name,
    address: `0xVisitor_${hex}`,
    privateKey: `pv_${hex}_${Math.abs(h * 99).toString(16).substring(0, 8)}`,
  };
}

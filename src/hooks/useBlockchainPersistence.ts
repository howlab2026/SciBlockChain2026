import { useEffect } from 'react';
import { Blockchain } from '../blockchain';
import type { VisitorWallet, Booth } from '../types';

const STORAGE_KEYS = {
  LEDGER: 'sciblockchain_ledger_v2',
  VISITORS: 'sciblockchain_visitors_v2',
  BOOTHS: 'sciblockchain_booths_v2',
  PROCESSED_TXS: 'sciblockchain_processed_txs_v2',
};

export function loadSavedBlockchain(): Blockchain | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEDGER);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const bc = Blockchain.fromJSON(parsed);
    
    // Check if any block transactions have empty IDs (due to the old Unicode bug)
    const hasBrokenTx = bc.chain.some(block => 
      block.transactions.some(tx => !tx.id || tx.id === '')
    );
    if (hasBrokenTx) {
      console.warn('Detected broken transactions with empty IDs. Resetting blockchain storage.');
      clearBlockchainStorage();
      return null;
    }
    return bc;
  } catch (e) {
    console.error('Failed to restore blockchain ledger from storage', e);
    return null;
  }
}

export function loadSavedVisitors(): VisitorWallet[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VISITORS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadSavedBooths(): Booth[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOTHS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadSavedProcessedTxs(): Record<string, boolean> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROCESSED_TXS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearBlockchainStorage() {
  localStorage.removeItem(STORAGE_KEYS.LEDGER);
  localStorage.removeItem(STORAGE_KEYS.VISITORS);
  localStorage.removeItem(STORAGE_KEYS.BOOTHS);
  localStorage.removeItem(STORAGE_KEYS.PROCESSED_TXS);
}

export function useBlockchainPersistence(
  blockchainRef: React.MutableRefObject<Blockchain>,
  blockchainTick: number,
  visitors: VisitorWallet[],
  booths: Booth[],
  processedTxIds: Record<string, boolean>
) {
  useEffect(() => {
    try {
      if (blockchainRef.current) {
        localStorage.setItem(STORAGE_KEYS.LEDGER, blockchainRef.current.exportChainData());
      }
    } catch (e) {
      console.warn('Failed to persist blockchain data', e);
    }
  }, [blockchainRef, blockchainTick]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VISITORS, JSON.stringify(visitors));
    } catch (e) {
      console.warn('Failed to persist visitors', e);
    }
  }, [visitors]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOTHS, JSON.stringify(booths));
    } catch (e) {
      console.warn('Failed to persist booths', e);
    }
  }, [booths]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROCESSED_TXS, JSON.stringify(processedTxIds));
    } catch (e) {
      console.warn('Failed to persist processed txs', e);
    }
  }, [processedTxIds]);
}

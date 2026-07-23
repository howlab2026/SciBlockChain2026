import { createContext, useContext, useRef, useState, useMemo, useCallback, useEffect, type ReactNode } from 'react';
import { Blockchain } from '../blockchain';
import { loadSavedBlockchain } from '../hooks/useBlockchainPersistence';
import confetti from 'canvas-confetti';

interface BlockchainContextType {
  blockchainRef: React.MutableRefObject<Blockchain>;
  blockchainTick: number;
  updateBlockchainState: () => void;
  isMining: boolean;
  miningProgress: number;
  difficulty: number;
  setDifficulty: (val: number) => void;
  miningReward: number;
  setMiningReward: (val: number) => void;
  minerAddress: string;
  setMinerAddress: (addr: string) => void;
  autoMine: boolean;
  setAutoMine: (val: boolean) => void;
  isChainHealthy: boolean;
  isCoinExpired: boolean;
  runMiningProcess: (onSuccess?: () => void) => Promise<void>;
  reMineChainFrom: (startIndex: number) => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const blockchainRef = useRef<Blockchain>(loadSavedBlockchain() || new Blockchain());
  const [blockchainTick, setBlockchainTick] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [difficulty, setDifficultyState] = useState(() => blockchainRef.current.difficulty || 2);
  const [miningReward, setMiningRewardState] = useState(() => blockchainRef.current.miningReward || 10);
  const [minerAddress, setMinerAddress] = useState('0xMiner_Central');
  const [autoMine, setAutoMine] = useState(true);

  const isMiningRef = useRef(false);
  const minerAddressRef = useRef(minerAddress);
  useEffect(() => { minerAddressRef.current = minerAddress; }, [minerAddress]);

  useEffect(() => { blockchainRef.current.difficulty = difficulty; }, [difficulty]);
  useEffect(() => { blockchainRef.current.miningReward = miningReward; }, [miningReward]);

  const updateBlockchainState = useCallback(() => {
    setBlockchainTick(prev => prev + 1);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isChainHealthy = useMemo(() => blockchainRef.current.isChainValid(), [blockchainTick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isCoinExpired = useMemo(() => blockchainRef.current.isExpired(), [blockchainTick]);

  const setDifficulty = useCallback((val: number) => {
    setDifficultyState(val);
    blockchainRef.current.difficulty = val;
  }, []);

  const setMiningReward = useCallback((val: number) => {
    setMiningRewardState(val);
    blockchainRef.current.miningReward = val;
  }, []);

  const runMiningProcess = useCallback(async (onSuccess?: () => void) => {
    if (isMiningRef.current) return;
    isMiningRef.current = true;
    setIsMining(true);
    setMiningProgress(10);

    const interval = setInterval(() => {
      setMiningProgress(prev => (prev >= 90 ? prev : prev + 10));
    }, 100);

    try {
      await blockchainRef.current.minePendingTransactions(minerAddressRef.current);
      setMiningProgress(100);
      clearInterval(interval);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#10b981', '#8b5cf6'],
      });

      setTimeout(() => {
        isMiningRef.current = false;
        setIsMining(false);
        setMiningProgress(0);
        updateBlockchainState();
        onSuccess?.();
      }, 500);
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      isMiningRef.current = false;
      setIsMining(false);
      setMiningProgress(0);
    }
  }, [updateBlockchainState]);

  const reMineChainFrom = useCallback(async (startIndex: number) => {
    if (isMiningRef.current) return;
    isMiningRef.current = true;
    setIsMining(true);
    setMiningProgress(10);
    try {
      for (let i = startIndex; i < blockchainRef.current.chain.length; i++) {
        const block = blockchainRef.current.chain[i];
        if (i > 0) block.previousHash = blockchainRef.current.chain[i - 1].hash;
        await block.mineBlock(blockchainRef.current.difficulty);
      }
      updateBlockchainState();
      confetti({ particleCount: 100, spread: 80, colors: ['#8b5cf6', '#3b82f6'] });
    } catch (e) {
      console.error(e);
    } finally {
      isMiningRef.current = false;
      setIsMining(false);
      setMiningProgress(0);
    }
  }, [updateBlockchainState]);

  return (
    <BlockchainContext.Provider value={{
      blockchainRef, blockchainTick, updateBlockchainState,
      isMining, miningProgress, difficulty, setDifficulty,
      miningReward, setMiningReward, minerAddress, setMinerAddress,
      autoMine, setAutoMine, isChainHealthy, isCoinExpired,
      runMiningProcess, reMineChainFrom,
    }}>
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchainContext() {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchainContext must be used within a BlockchainProvider');
  }
  return context;
}

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Blockchain } from '../blockchain';
import confetti from 'canvas-confetti';

export function useBlockchain() {
  const blockchainRef = useRef<Blockchain>(new Blockchain());
  const [blockchainTick, setBlockchainTick] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [difficulty, setDifficultyState] = useState(2);
  const [miningReward, setMiningRewardState] = useState(10);
  const [minerAddress, setMinerAddress] = useState('0xMiner_Central');
  const [autoMine, setAutoMine] = useState(true);

  // Keep refs in sync to avoid stale closures
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

  return {
    blockchainRef,
    blockchainTick,
    updateBlockchainState,
    isMining,
    miningProgress,
    difficulty,
    setDifficulty,
    miningReward,
    setMiningReward,
    minerAddress,
    setMinerAddress,
    autoMine,
    setAutoMine,
    isChainHealthy,
    isCoinExpired,
    runMiningProcess,
    reMineChainFrom,
  };
}

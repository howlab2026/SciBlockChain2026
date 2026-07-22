import React, { useState, useMemo } from 'react';
import {
  Server, Cpu, Coins, CheckCircle, ShieldAlert, AlertTriangle, Play,
  RefreshCw, Search, X
} from 'lucide-react';
import { Blockchain } from '../blockchain';
import type { ToastType } from '../hooks/useToast';

interface ExplorerTabProps {
  blockchainRef: React.MutableRefObject<Blockchain>;
  blockchainTick: number;
  difficulty: number;
  miningReward: number;
  isMining: boolean;
  miningProgress: number;
  isChainHealthy: boolean;
  originalTransactions: Record<string, number>;
  setOriginalTransactions: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  runMiningProcess: () => Promise<void>;
  reMineChainFrom: (index: number) => Promise<void>;
  addToast: (type: ToastType, title: string, message?: string) => void;
  updateBlockchainState: () => void;
}

type TxFilter = 'all' | 'card' | 'booth' | 'mining' | 'system';

export function ExplorerTab({
  blockchainRef, blockchainTick: _tick, difficulty: _difficulty, miningReward,
  isMining, miningProgress, isChainHealthy,
  originalTransactions, setOriginalTransactions,
  runMiningProcess, reMineChainFrom, addToast, updateBlockchainState,
}: ExplorerTabProps) {
  const bc = blockchainRef.current;
  const coinName = bc.coinName;

  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [tamperingBlockIndex, setTamperingBlockIndex] = useState<number | null>(null);
  const [tamperingTxId, setTamperingTxId] = useState('');
  const [tamperedAmount, setTamperedAmount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [txFilter, setTxFilter] = useState<TxFilter>('all');

  const handleTamper = (blockIndex: number, txId: string, originalAmt: number) => {
    if (!(txId in originalTransactions)) {
      setOriginalTransactions(prev => ({ ...prev, [txId]: originalAmt }));
    }
    setTamperingBlockIndex(blockIndex);
    setTamperingTxId(txId);
    setTamperedAmount(originalTransactions[txId] ?? originalAmt);
  };

  const executeTampering = () => {
    if (tamperingBlockIndex === null || !tamperingTxId) return;
    const block = bc.chain[tamperingBlockIndex];
    const tx = block.transactions.find(t => t.id === tamperingTxId);
    if (tx) {
      tx.amount = tamperedAmount;
      updateBlockchainState();
      addToast('warning', 'Tampering Executed!', `Block #${tamperingBlockIndex} TX was tampered. Check chain validity.`);
    }
    setTamperingBlockIndex(null);
    setTamperingTxId('');
  };

  const restoreTransaction = (blockIndex: number, txId: string) => {
    const originalAmt = originalTransactions[txId];
    if (originalAmt === undefined) return;
    const block = bc.chain[blockIndex];
    const tx = block.transactions.find(t => t.id === txId);
    if (tx) { tx.amount = originalAmt; updateBlockchainState(); addToast('success', 'Restored', 'Transaction restored to original amount.'); }
  };

  const allTxs = useMemo(() => {
    return bc.chain.flatMap((block, bi) =>
      block.transactions.map(tx => ({ ...tx, blockIndex: bi }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_tick]);

  const filteredTxs = useMemo(() => {
    let result = allTxs;
    if (txFilter === 'card') result = result.filter(t => t.fromAddress === 'CARD_PAYMENT');
    else if (txFilter === 'booth') result = result.filter(t => t.toAddress.startsWith('0xBooth'));
    else if (txFilter === 'mining') result = result.filter(t => t.purpose === 'Mining Reward');
    else if (txFilter === 'system') result = result.filter(t => t.fromAddress === 'SYSTEM');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.fromAddress.toLowerCase().includes(q) ||
        t.toAddress.toLowerCase().includes(q) ||
        t.purpose.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allTxs, txFilter, searchQuery]);

  const filterBtn = (label: string, value: TxFilter) => (
    <button
      key={value}
      onClick={() => setTxFilter(value)}
      className={`neon-btn ${txFilter === value ? 'btn-primary' : 'btn-secondary'}`}
      style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px' }}
    >
      {label}
    </button>
  );

  return (
    <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        {[
          { icon: <Server size={28} color="var(--neon-blue)" />, label: 'Total Blocks', value: `${bc.chain.length}` },
          { icon: <Cpu size={28} color="var(--neon-purple)" />, label: 'Mempool Pending', value: `${bc.pendingTransactions.length} TXs` },
          { icon: <Coins size={28} color="var(--neon-yellow)" />, label: 'Mining Reward', value: `${miningReward} Coins` },
          { icon: isChainHealthy ? <CheckCircle size={28} color="var(--neon-emerald)" /> : <ShieldAlert size={28} color="#ef4444" className="animate-pulse" />, label: 'Chain Health', value: isChainHealthy ? 'Valid' : 'Tampered' },
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            {stat.icon}
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{stat.label}</span>
              <h4 style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginTop: '2px' }}>{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {bc.pendingTransactions.length > 0 && (
        <div className="glass-card pulse-blue" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RefreshCw className="animate-spin" size={16} color="var(--neon-blue)" />
            <div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{bc.pendingTransactions.length} Pending Transactions</span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mine a new block to confirm them into the blockchain ledger.</p>
            </div>
          </div>
          <button onClick={runMiningProcess} disabled={isMining} className="neon-btn btn-primary" style={{ minWidth: '130px' }}>
            {isMining ? <><Cpu className="animate-pulse" size={13} /> Mining ({miningProgress}%)</> : <><Play size={13} /> Mine Block</>}
          </button>
        </div>
      )}

      <div>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Server size={16} color="var(--neon-blue)" /> Blockchain Visualizer
        </h3>
        <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', padding: '8px 4px 16px', alignItems: 'stretch' }}>
          {bc.chain.map((block, index) => {
            const isBlockValid = block.hash === block.calculateHash();
            const isLinkValid = index === 0 || block.previousHash === bc.chain[index - 1].hash;
            const valid = isBlockValid && isLinkValid;
            return (
              <div key={block.index} style={{ display: 'flex', alignItems: 'center' }}>
                {index > 0 && (
                  <div style={{ width: '36px', height: '2px', background: isLinkValid ? 'linear-gradient(90deg, #10b981, #3b82f6)' : '#ef4444', position: 'relative', flexShrink: 0 }}>
                    {!isLinkValid && <AlertTriangle size={12} color="#ef4444" style={{ position: 'absolute', top: '-14px', left: '10px' }} />}
                  </div>
                )}
                <div
                  onClick={() => setSelectedBlockIndex(block.index === selectedBlockIndex ? null : block.index)}
                  className="glass-card"
                  style={{
                    width: '240px', padding: '14px', cursor: 'pointer', flexShrink: 0,
                    border: block.index === selectedBlockIndex ? '1px solid var(--neon-blue)' : valid ? '1px solid rgba(255,255,255,0.06)' : '2px solid #ef4444',
                    boxShadow: valid ? '0 4px 15px rgba(0,0,0,0.2)' : '0 0 20px rgba(239,68,68,0.2)',
                    background: valid ? 'var(--bg-panel)' : 'rgba(239,68,68,0.04)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '6px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#60a5fa' }}>BLOCK #{block.index}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(block.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Hash:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'white' }}>{block.hash.substring(0, 12)}...</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Prev:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.45)' }}>{block.previousHash.substring(0, 12)}...</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>TXs:</span>
                      <span style={{ fontWeight: '600' }}>{block.transactions.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Nonce:</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{block.nonce}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                    <span style={{ fontSize: '10px', color: valid ? '#34d399' : '#f87171', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {valid ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                      {valid ? 'Valid' : 'Tampered!'}
                    </span>
                    {!valid && (
                      <button onClick={e => { e.stopPropagation(); reMineChainFrom(block.index); }} className="neon-btn btn-primary" style={{ padding: '2px 7px', fontSize: '10px', borderRadius: '4px' }}>
                        Re-mine
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={15} color="var(--neon-purple)" /> Search &amp; Filter Transactions
          </h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {filterBtn('All', 'all')}
            {filterBtn('Card Payment', 'card')}
            {filterBtn('Booth Payment', 'booth')}
            {filterBtn('Mining Reward', 'mining')}
            {filterBtn('System', 'system')}
          </div>
        </div>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search address, TX ID, purpose..."
            className="neon-input" style={{ paddingLeft: '34px' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
          Showing {filteredTxs.length} TXs (Total {allTxs.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
          {filteredTxs.slice(0, 50).map(tx => {
            const isSystem = tx.fromAddress === 'SYSTEM';
            const isCard = tx.fromAddress === 'CARD_PAYMENT';
            const isMiningReward = tx.purpose === 'Mining Reward';
            const originalAmt = originalTransactions[tx.id];
            const isTampered = originalAmt !== undefined && tx.amount !== originalAmt;
            const leftColor = isTampered ? '#ef4444' : isSystem ? '#3b82f6' : isCard ? '#f59e0b' : isMiningReward ? '#8b5cf6' : '#10b981';

            return (
              <div key={`${tx.id}-${tx.blockIndex}`} className="glass-card" style={{
                padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
                borderLeft: `3px solid ${leftColor}`,
                background: isTampered ? 'rgba(239,68,68,0.04)' : 'var(--bg-panel)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Block #{tx.blockIndex} | TX: {tx.id.substring(0, 20)}...
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '3px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-muted)' }}>From: <strong style={{ color: 'white', fontFamily: 'var(--font-mono)' }}>{tx.fromAddress.substring(0, 14)}...</strong></span>
                    <span style={{ color: 'var(--text-muted)' }}>To: <strong style={{ color: 'white', fontFamily: 'var(--font-mono)' }}>{tx.toAddress.substring(0, 14)}...</strong></span>
                    <span style={{ color: '#93c5fd' }}>{tx.purpose}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: isTampered ? '#ef4444' : 'white' }}>{tx.amount}</span>
                    {isTampered && <span style={{ display: 'block', fontSize: '10px', color: '#9ca3af', textDecoration: 'line-through' }}>orig: {originalAmt}</span>}
                  </div>
                  {!isSystem && selectedBlockIndex === tx.blockIndex && (
                    isTampered
                      ? <button onClick={() => restoreTransaction(tx.blockIndex, tx.id)} className="neon-btn btn-secondary" style={{ padding: '4px 10px', fontSize: '10px' }}>Restore</button>
                      : <button onClick={() => handleTamper(tx.blockIndex, tx.id, tx.amount)} className="neon-btn btn-danger" style={{ padding: '4px 10px', fontSize: '10px' }}>Tamper</button>
                  )}
                </div>
              </div>
            );
          })}
          {filteredTxs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No transactions match your search.
            </div>
          )}
        </div>
        {selectedBlockIndex !== null && (
          <p style={{ fontSize: '11px', color: 'rgba(59,130,246,0.7)', marginTop: '8px' }}>
            * Block #{selectedBlockIndex} selected - Tamper/Restore buttons enabled for transactions in this block.
          </p>
        )}
      </div>

      {tamperingBlockIndex !== null && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '360px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #ef4444' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle color="#ef4444" size={18} /> Tamper Transaction Amount
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Modify the ledger transaction amount. This instantly breaks the cryptographic hash integrity of the block chain.
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tampered Amount ({coinName})</label>
              <input type="number" value={tamperedAmount} onChange={e => setTamperedAmount(parseInt(e.target.value) || 0)} className="neon-input" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={() => setTamperingBlockIndex(null)} className="neon-btn btn-secondary">Cancel</button>
              <button onClick={executeTampering} className="neon-btn btn-danger" style={{ background: '#ef4444', color: 'white' }}>Execute Tampering</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

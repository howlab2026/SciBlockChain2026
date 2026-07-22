import React, { useState, useMemo } from 'react';
import { QrCode, PlusCircle, RefreshCw, Play, CheckCircle } from 'lucide-react';
import { Blockchain } from '../blockchain';
import type { Booth, ReceiptData } from '../types';
import { VisualQRCode } from './VisualQRCode';
import type { ToastType } from '../hooks/useToast';

interface BoothTabProps {
  blockchainRef: React.MutableRefObject<Blockchain>;
  blockchainTick: number;
  updateBlockchainState: () => void;
  isCoinExpired: boolean;
  isMining: boolean;
  autoMine: boolean;
  booths: Booth[];
  setBooths: React.Dispatch<React.SetStateAction<Booth[]>>;
  activeBoothId: string;
  setActiveBoothId: (id: string) => void;
  processedTxIds: Record<string, boolean>;
  setProcessedTxIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  runMiningProcess: (onSuccess?: () => void) => Promise<void>;
  onShowReceipt: (data: ReceiptData) => void;
  addToast: (type: ToastType, title: string, message?: string) => void;
}

export function BoothTab({
  blockchainRef, blockchainTick: _tick, updateBlockchainState: _updateBlockchainState,
  isCoinExpired: _isCoinExpired, isMining: _isMining, booths, setBooths, activeBoothId, setActiveBoothId,
  processedTxIds, setProcessedTxIds, runMiningProcess, onShowReceipt, addToast,
}: BoothTabProps) {
  const bc = blockchainRef.current;
  const coinName = bc.coinName;

  const [newBoothName, setNewBoothName] = useState('');
  const [newBoothCost, setNewBoothCost] = useState(10);
  const [newBoothDesc, setNewBoothDesc] = useState('');

  const activeBooth = useMemo(() => booths.find(b => b.id === activeBoothId) || booths[0], [booths, activeBoothId]);

  const getBoothStats = (boothId: string) => {
    let visits = 0, revenue = 0;
    bc.chain.forEach(block => {
      block.transactions.forEach(tx => {
        if (tx.toAddress === boothId && tx.fromAddress !== 'SYSTEM') { visits++; revenue += tx.amount; }
      });
    });
    return { visits, revenue };
  };

  const isTxProcessed = (txId: string) => !!processedTxIds[txId];

  const activeBoothStatus = useMemo(() => {
    const pendingTx = bc.pendingTransactions.find(
      tx => tx.toAddress === activeBoothId && tx.amount === activeBooth.cost && !isTxProcessed(tx.id)
    );
    if (pendingTx) return { status: 'pending' as const, payer: pendingTx.fromAddress, txId: pendingTx.id };

    for (let i = bc.chain.length - 1; i >= 1; i--) {
      const block = bc.chain[i];
      const confirmed = block.transactions.find(
        tx => tx.toAddress === activeBoothId && tx.amount === activeBooth.cost
          && !isTxProcessed(tx.id) && tx.fromAddress.startsWith('0xVisitor')
      );
      if (confirmed) return { status: 'success' as const, payer: confirmed.fromAddress, txId: confirmed.id, blockIndex: i };
    }
    return { status: 'idle' as const, payer: '', txId: '', blockIndex: 0 };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_tick, activeBoothId, activeBooth.cost, processedTxIds]);

  const handleCreateBooth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoothName.trim()) return;
    let hash = 0;
    for (let i = 0; i < newBoothName.length; i++) {
      hash = ((hash << 5) - hash) + newBoothName.charCodeAt(i); hash |= 0;
    }
    const boothId = `0xBooth_${Math.abs(hash).toString(16).substring(0, 8)}`;
    setBooths(prev => [...prev, { id: boothId, name: newBoothName, description: newBoothDesc || 'Science Booth', cost: newBoothCost, visits: 0, revenue: 0 }]);
    setNewBoothName(''); setNewBoothCost(10); setNewBoothDesc('');
    setActiveBoothId(boothId);
    addToast('success', 'Booth Created!', `${newBoothName} has been registered.`);
  };

  const resetBoothPayment = () => {
    if (activeBoothStatus.txId) {
      setProcessedTxIds(prev => ({ ...prev, [activeBoothStatus.txId]: true }));
    }
  };

  return (
    <div className="tab-content" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>

      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={18} color="var(--neon-emerald)" /> Booth Directory
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Select a booth to show its payment QR code.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '340px' }}>
          {booths.map(b => {
            const active = b.id === activeBoothId;
            const stats = getBoothStats(b.id);
            return (
              <div
                key={b.id}
                onClick={() => setActiveBoothId(b.id)}
                className="glass-card"
                style={{
                  padding: '11px 13px', cursor: 'pointer',
                  border: active ? '1px solid var(--neon-emerald)' : '1px solid rgba(255,255,255,0.05)',
                  background: active ? 'rgba(16,185,129,0.07)' : 'var(--bg-panel)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', fontSize: '13px', color: active ? 'white' : 'rgba(255,255,255,0.75)' }}>{b.name}</span>
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>{b.cost} Coins</span>
                </div>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.description}</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '5px', fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                  <span>Visits: <strong style={{ color: 'white' }}>{stats.visits}</strong></span>
                  <span>Revenue: <strong style={{ color: 'var(--neon-emerald)' }}>{stats.revenue} Coins</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '14px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>Register New Booth</h4>
          <form onSubmit={handleCreateBooth} style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <input type="text" placeholder="Booth Name" value={newBoothName} onChange={e => setNewBoothName(e.target.value)} className="neon-input" style={{ padding: '8px', fontSize: '12px' }} required />
            <input type="text" placeholder="Description (optional)" value={newBoothDesc} onChange={e => setNewBoothDesc(e.target.value)} className="neon-input" style={{ padding: '8px', fontSize: '12px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '7px' }}>
              <input type="number" placeholder="Cost" value={newBoothCost} onChange={e => setNewBoothCost(parseInt(e.target.value) || 0)} className="neon-input" style={{ padding: '8px', fontSize: '12px' }} required />
              <button type="submit" className="neon-btn btn-success" style={{ padding: '8px', fontSize: '12px' }}>
                <PlusCircle size={12} /> Register
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '22px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'white' }}>{activeBooth.name}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '460px' }}>{activeBooth.description}</p>
          <div style={{ display: 'inline-block', background: 'rgba(16,185,129,0.13)', color: '#10b981', fontWeight: '700', padding: '5px 16px', borderRadius: '20px', marginTop: '10px', fontSize: '14px', border: '1px solid rgba(16,185,129,0.2)' }}>
            Experience Fee: {activeBooth.cost} {coinName}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <VisualQRCode value={`${activeBooth.id}:${activeBooth.cost}`} size={180} />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {activeBooth.id}
          </span>
        </div>

        <div className="glass-card" style={{
          width: '100%', maxWidth: '420px', padding: '20px', textAlign: 'center',
          border: activeBoothStatus.status === 'success' ? '1px solid rgba(16,185,129,0.3)'
                : activeBoothStatus.status === 'pending' ? '1px solid rgba(59,130,246,0.3)'
                : '1px solid rgba(255,255,255,0.05)',
          background: activeBoothStatus.status === 'success' ? 'rgba(16,185,129,0.04)'
                    : activeBoothStatus.status === 'pending' ? 'rgba(59,130,246,0.04)'
                    : 'rgba(7,9,19,0.3)',
          borderRadius: '12px',
        }}>
          {activeBoothStatus.status === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6b7280' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>Waiting for Visitor Payment...</span>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Scan the QR code to proceed with payment.</p>
            </div>
          )}
          {activeBoothStatus.status === 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <RefreshCw className="animate-spin" size={20} color="var(--neon-blue)" />
              <span style={{ fontSize: '14px', color: 'var(--neon-blue)', fontWeight: '700' }}>Approving Payment... (0/1 Confirmations)</span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TX: {activeBoothStatus.txId.substring(0, 16)}...</p>
              <button onClick={() => runMiningProcess()} className="neon-btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                <Play size={11} /> Mine Block Now
              </button>
            </div>
          )}
          {activeBoothStatus.status === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={28} color="var(--neon-emerald)" />
              <span style={{ fontSize: '17px', color: 'var(--neon-emerald)', fontWeight: '800' }}>Payment Complete! Ready for Experiment</span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Received: <strong>{activeBooth.cost} {coinName}</strong> | Payer: {activeBoothStatus.payer.substring(0, 14)}...
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button onClick={resetBoothPayment} className="neon-btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>Next Visitor</button>
                <button
                  onClick={() => {
                    const block = bc.chain[activeBoothStatus.blockIndex];
                    if (block) {
                      onShowReceipt({
                        txId: activeBoothStatus.txId, fromAddress: activeBoothStatus.payer,
                        toAddress: activeBooth.id, amount: activeBooth.cost, purpose: `Booth Payment: ${activeBooth.name}`,
                        blockIndex: activeBoothStatus.blockIndex, timestamp: block.timestamp, coinName,
                      });
                    }
                  }}
                  className="neon-btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  <Play size={11} /> View Receipt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

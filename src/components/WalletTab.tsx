import React, { useState, useMemo } from 'react';
import {
  Wallet, CreditCard, ArrowRight, Lock, Unlock, Copy, Check,
  Zap, Plus, Users, QrCode
} from 'lucide-react';
import { Blockchain, Transaction } from '../blockchain';
import type { Booth, VisitorWallet, ReceiptData } from '../types';
import type { ToastType } from '../hooks/useToast';

interface WalletTabProps {
  blockchainRef: React.MutableRefObject<Blockchain>;
  blockchainTick: number;
  updateBlockchainState: () => void;
  isCoinExpired: boolean;
  autoMine: boolean;
  booths: Booth[];
  activeBoothId: string;
  visitors: VisitorWallet[];
  activeVisitorIndex: number;
  setActiveVisitorIndex: (i: number) => void;
  onAddVisitor: (name: string) => void;
  onShowCardModal: () => void;
  onShowReceipt: (data: ReceiptData) => void;
  addToast: (type: ToastType, title: string, message?: string) => void;
  runMiningProcess: (onSuccess?: () => void) => Promise<void>;
}

export function WalletTab({
  blockchainRef, blockchainTick: _tick, updateBlockchainState,
  isCoinExpired, autoMine, booths, activeBoothId,
  visitors, activeVisitorIndex, setActiveVisitorIndex, onAddVisitor,
  onShowCardModal, onShowReceipt, addToast, runMiningProcess,
}: WalletTabProps) {
  const bc = blockchainRef.current;
  const coinName = bc.coinName;
  const expiryDate = bc.expiryDate;

  const [showPrivKey, setShowPrivKey] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState(10);
  const [sendPurpose, setSendPurpose] = useState('Booth Experience');
  const [enteredKey, setEnteredKey] = useState('');
  const [newVisitorName, setNewVisitorName] = useState('');
  const [showAddVisitor, setShowAddVisitor] = useState(false);

  const visitor = visitors[activeVisitorIndex];

  const balance = useMemo(
    () => bc.getBalanceOfAddress(visitor.address),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_tick, visitor.address]
  );

  const allBalances = useMemo(
    () => visitors.map(v => ({ ...v, balance: bc.getBalanceOfAddress(v.address) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_tick, visitors]
  );

  const activeBooth = useMemo(() => booths.find(b => b.id === activeBoothId) || booths[0], [booths, activeBoothId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCoinExpired) { addToast('error', 'Expired Token', 'Coin expiry date has passed.'); return; }
    if (enteredKey !== visitor.privateKey) { addToast('error', 'Signature Error', 'Private key does not match.'); return; }
    const tx = new Transaction(visitor.address, sendTo, sendAmount, sendPurpose);
    try {
      tx.signTransaction(visitor.privateKey);
      bc.addTransaction(tx);
      setSendTo(''); setEnteredKey('');
      updateBlockchainState();
      addToast('info', 'Transaction Sent', 'Added to Mempool.');
      if (autoMine) {
        runMiningProcess(() => {
          const latestBlock = bc.chain[bc.chain.length - 1];
          const found = latestBlock?.transactions.find(t => t.id === tx.id);
          if (found) {
            onShowReceipt({
              txId: found.id, fromAddress: found.fromAddress, toAddress: found.toAddress,
              amount: found.amount, purpose: found.purpose,
              blockIndex: latestBlock.index, timestamp: latestBlock.timestamp, coinName,
            });
          }
        });
      }
    } catch (err: unknown) {
      addToast('error', 'Transfer Error', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleOneClick = (booth: Booth) => {
    if (isCoinExpired) { addToast('error', 'Expired Token', 'Coin expiry date has passed.'); return; }
    if (balance < booth.cost) { addToast('warning', 'Insufficient Balance', 'Please charge coins using Card Payment!'); return; }
    const tx = new Transaction(visitor.address, booth.id, booth.cost, `Booth Payment: ${booth.name}`);
    try {
      tx.signTransaction(visitor.privateKey);
      bc.addTransaction(tx);
      updateBlockchainState();
      addToast('info', `Payment Sent`, `${booth.name} - ${booth.cost} Coins`);
      if (autoMine) {
        runMiningProcess(() => {
          const latestBlock = bc.chain[bc.chain.length - 1];
          const found = latestBlock?.transactions.find(t => t.id === tx.id);
          if (found) {
            onShowReceipt({
              txId: found.id, fromAddress: found.fromAddress, toAddress: found.toAddress,
              amount: found.amount, purpose: found.purpose,
              blockIndex: latestBlock.index, timestamp: latestBlock.timestamp, coinName,
            });
          }
        });
      }
    } catch (err: unknown) {
      addToast('error', 'Error', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="tab-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>

      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="var(--neon-blue)" /> Select Visitor Wallet
            </h3>
            <button
              onClick={() => setShowAddVisitor(v => !v)}
              className="neon-btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
            >
              <Plus size={11} /> Add
            </button>
          </div>

          {showAddVisitor && (
            <form onSubmit={e => { e.preventDefault(); if (newVisitorName.trim() && visitors.length < 6) { onAddVisitor(newVisitorName.trim()); setNewVisitorName(''); setShowAddVisitor(false); } }} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text" value={newVisitorName} onChange={e => setNewVisitorName(e.target.value)}
                placeholder="New Visitor Name" className="neon-input"
                style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
              />
              <button type="submit" className="neon-btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Add</button>
            </form>
          )}

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {allBalances.map((v, i) => (
              <button
                key={v.address}
                onClick={() => setActiveVisitorIndex(i)}
                className={`neon-btn ${i === activeVisitorIndex ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
              >
                <span>{v.name}</span>
                <span style={{ fontSize: '10px', opacity: 0.8 }}>{v.balance} Coins</span>
              </button>
            ))}
          </div>
        </div>

        {isCoinExpired && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#f87171' }}>
            Warning: Token expired ({expiryDate}). Re-issue in Admin tab.
          </div>
        )}

        <div style={{
          background: 'linear-gradient(135deg, rgba(30,41,79,0.85), rgba(88,28,135,0.65))',
          borderRadius: '16px', padding: '22px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 10px 30px rgba(59,130,246,0.2)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-8%', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)' }}>Virtual Wallet</span>
              <h4 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginTop: '2px' }}>{visitor.name}</h4>
            </div>
            <Wallet size={34} color="rgba(255,255,255,0.15)" />
          </div>
          <div style={{ zIndex: 1, marginTop: '16px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Balance ({coinName})</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '36px', fontWeight: '800', color: 'white', textShadow: '0 0 15px rgba(255,255,255,0.25)' }}>{balance}</span>
              <span style={{ fontSize: '16px', color: '#60a5fa', fontWeight: '600' }}>{coinName.substring(0, 7)}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <span>approx {(balance * 100).toLocaleString()} KRW</span>
              <span style={{ color: isCoinExpired ? '#f87171' : 'rgba(255,255,255,0.4)' }}>Expires: {expiryDate}</span>
            </div>
          </div>
          <div style={{ marginTop: '14px', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
                ADDR: {visitor.address}
              </span>
              <button onClick={() => copyToClipboard(visitor.address, 'address')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                {copiedText === 'address' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
                KEY: {showPrivKey ? visitor.privateKey : '....................'}
              </span>
              <button onClick={() => setShowPrivKey(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                {showPrivKey ? <Lock size={11} /> : <Unlock size={11} />}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button onClick={onShowCardModal} disabled={isCoinExpired} className="neon-btn btn-primary" style={{ padding: '13px', opacity: isCoinExpired ? 0.5 : 1 }}>
            <CreditCard size={15} /> Card Top-up
          </button>
          <button
            onClick={() => { if (activeBooth) { setSendTo(activeBooth.id); setSendAmount(activeBooth.cost); setSendPurpose(`Booth: ${activeBooth.name}`); } }}
            className="neon-btn btn-secondary" style={{ padding: '13px' }}
          >
            <QrCode size={15} /> Quick Booth Setup
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowRight size={18} color="var(--neon-purple)" /> Send {coinName}
        </h3>

        <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Recipient Address</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="0xBooth_... or 0xVisitor_..." className="neon-input" required />
              <select
                onChange={e => {
                  const b = booths.find(x => x.id === e.target.value);
                  if (b) { setSendTo(b.id); setSendAmount(b.cost); setSendPurpose(`Booth: ${b.name}`); }
                }}
                className="neon-input" style={{ width: '120px', padding: '6px', fontSize: '12px' }}
              >
                <option value="">Select Booth</option>
                {booths.map(b => <option key={b.id} value={b.id}>{b.name} ({b.cost})</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Amount</label>
              <input type="number" value={sendAmount} onChange={e => setSendAmount(parseInt(e.target.value) || 0)} min="1" className="neon-input" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Purpose</label>
              <input type="text" value={sendPurpose} onChange={e => setSendPurpose(e.target.value)} className="neon-input" required />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Private Key (Sign Transaction)</label>
            <input type="password" value={enteredKey} onChange={e => setEnteredKey(e.target.value)} placeholder="pv_..." className="neon-input" required />
            <span style={{ fontSize: '10px', color: 'rgba(59,130,246,0.7)', marginTop: '4px', display: 'block' }}>
              For test: <code style={{ color: 'white' }}>{visitor.privateKey}</code>
            </span>
          </div>
          <button type="submit" disabled={isCoinExpired} className="neon-btn btn-primary" style={{ width: '100%', padding: '13px', opacity: isCoinExpired ? 0.5 : 1 }}>
            <Lock size={15} /> Sign &amp; Send Transaction
          </button>
        </form>

        <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Zap size={13} color="var(--neon-yellow)" /> Quick Booth Payment (1-Click)
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {booths.map(b => (
              <button
                key={b.id}
                onClick={() => handleOneClick(b)}
                disabled={isCoinExpired}
                className="neon-btn btn-secondary"
                style={{ padding: '6px 11px', borderRadius: '8px', fontSize: '11px', opacity: isCoinExpired ? 0.5 : 1 }}
              >
                {b.name} ({b.cost})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

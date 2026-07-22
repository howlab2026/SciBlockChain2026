import React, { useState } from 'react';
import { CreditCard, RefreshCw, Check, X } from 'lucide-react';
import { Blockchain, Transaction } from '../blockchain';
import type { VisitorWallet } from '../types';
import type { ToastType } from '../hooks/useToast';
import confetti from 'canvas-confetti';

interface CardPaymentModalProps {
  show: boolean;
  onClose: () => void;
  visitor: VisitorWallet;
  blockchain: React.MutableRefObject<Blockchain>;
  updateBlockchainState: () => void;
  autoMine: boolean;
  runMiningProcess: (onSuccess?: () => void) => Promise<void>;
  addToast: (type: ToastType, title: string, message?: string) => void;
}

const CARD_AMOUNTS = [
  { krw: 5000,  coins: 50 },
  { krw: 10000, coins: 100 },
  { krw: 20000, coins: 200 },
  { krw: 50000, coins: 500 },
];

export function CardPaymentModal({
  show, onClose, visitor, blockchain, updateBlockchainState, autoMine, runMiningProcess, addToast
}: CardPaymentModalProps) {
  const [cardAmount, setCardAmount] = useState(10000);
  const [cardNumber, setCardNumber] = useState('4311 9283 4821 0092');
  const [cardExpiry, setCardExpiry] = useState('12/29');
  const [cardCvv, setCardCvv] = useState('382');
  const [cardCompany, setCardCompany] = useState('KB Kookmin Card');
  const [isCharging, setIsCharging] = useState(false);

  if (!show) return null;

  const krwToCoin = (krw: number) => Math.floor(krw / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCharging(true);
    setTimeout(() => {
      const chargedCoins = krwToCoin(cardAmount);
      const tx = new Transaction(
        'CARD_PAYMENT',
        visitor.address,
        chargedCoins,
        `Card Top-up (${cardAmount.toLocaleString()} KRW)`
      );
      try {
        blockchain.current.addTransaction(tx);
        setIsCharging(false);
        onClose();
        updateBlockchainState();
        confetti({ particleCount: 50, spread: 40, colors: ['#10b981', '#3b82f6'] });
        addToast('success', `${chargedCoins} Coins Charged!`, `${cardAmount.toLocaleString()} KRW -> ${chargedCoins} Coins`);
        if (autoMine) runMiningProcess();
      } catch (err: unknown) {
        setIsCharging(false);
        addToast('error', 'Payment Failed', err instanceof Error ? err.message : 'Unknown error');
      }
    }, 1400);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div className="glass-card scanline-effect" style={{
        width: '420px', padding: '28px',
        display: 'flex', flexDirection: 'column', gap: '20px',
        border: '1px solid rgba(59,130,246,0.3)',
        boxShadow: '0 20px 50px rgba(59,130,246,0.25)',
        animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={20} color="var(--neon-blue)" />
            Card Payment Simulator
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          height: '170px',
          background: 'linear-gradient(135deg, #0d1224, #1e294b)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '14px', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          color: 'white', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#60a5fa' }}>{cardCompany}</span>
            <div style={{ width: '40px', height: '26px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
          </div>
          <div style={{ width: '32px', height: '24px', background: '#eab308', borderRadius: '4px', opacity: 0.8, zIndex: 1 }} />
          <div style={{ zIndex: 1 }}>
            <div style={{ fontSize: '16px', letterSpacing: '2px', fontFamily: 'var(--font-mono)' }}>{cardNumber}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
              <span>Holder: {visitor.name}</span>
              <span>Expires: {cardExpiry}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Top-up Amount (KRW)</label>
            <select value={cardAmount} onChange={e => setCardAmount(parseInt(e.target.value))} className="neon-input">
              {CARD_AMOUNTS.map(a => (
                <option key={a.krw} value={a.krw}>{a.krw.toLocaleString()} KRW (= {a.coins} Coins)</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Card Number</label>
              <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="neon-input" style={{ padding: '8px' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Issuer</label>
              <select value={cardCompany} onChange={e => setCardCompany(e.target.value)} className="neon-input" style={{ padding: '8px' }}>
                {['KB Kookmin Card','Shinhan Card','Toss Pay','Kakao Pay','Hana Card'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Expiry</label>
              <input type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} className="neon-input" style={{ padding: '8px' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>CVC</label>
              <input type="text" value={cardCvv} onChange={e => setCardCvv(e.target.value)} className="neon-input" style={{ padding: '8px' }} required />
            </div>
          </div>
          <button type="submit" disabled={isCharging} className="neon-btn btn-success" style={{ width: '100%', padding: '14px', marginTop: '4px' }}>
            {isCharging
              ? <><RefreshCw className="animate-spin" size={16} /> Approving Payment...</>
              : <><Check size={16} /> Approve {cardAmount.toLocaleString()} KRW Payment</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}

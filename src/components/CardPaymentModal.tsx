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
        confetti({ particleCount: 50, spread: 40, colors: ['#0d9488', '#4f46e5'] });
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
      backgroundColor: 'rgba(15,23,42,0.45)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div className="glass-card" style={{
        width: '420px', padding: '28px',
        display: 'flex', flexDirection: 'column', gap: '20px',
        border: '1px solid rgba(147,197,253,0.8)',
        boxShadow: '0 20px 50px rgba(148,163,184,0.25)',
        animation: 'fadeIn 0.2s ease', background: '#ffffff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={20} color="#4f46e5" />
            가상 카드 결제 충전 (Card Payment)
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Credit Card Design Graphic */}
        <div style={{
          height: '170px',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '16px', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: '0 8px 25px rgba(99,102,241,0.3)',
          color: 'white', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.2), transparent 70%)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>{cardCompany}</span>
            <div style={{ width: '40px', height: '26px', background: 'rgba(255,255,255,0.2)', borderRadius: '6px' }} />
          </div>
          <div style={{ width: '32px', height: '24px', background: '#fbbf24', borderRadius: '4px', opacity: 0.9, zIndex: 1 }} />
          <div style={{ zIndex: 1 }}>
            <div style={{ fontSize: '16px', letterSpacing: '2px', fontFamily: 'var(--font-mono)' }}>{cardNumber}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
              <span>Holder: {visitor.name}</span>
              <span>Expires: {cardExpiry}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '6px', fontWeight: '600' }}>충전 금액 선택 (KRW)</label>
            <select value={cardAmount} onChange={e => setCardAmount(parseInt(e.target.value))} className="neon-input">
              {CARD_AMOUNTS.map(a => (
                <option key={a.krw} value={a.krw}>{a.krw.toLocaleString()} KRW (= {a.coins} Coins)</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px', fontWeight: '600' }}>카드 번호</label>
              <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="neon-input" style={{ padding: '8px' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px', fontWeight: '600' }}>발급사</label>
              <select value={cardCompany} onChange={e => setCardCompany(e.target.value)} className="neon-input" style={{ padding: '8px' }}>
                {['KB Kookmin Card','Shinhan Card','Toss Pay','Kakao Pay','Hana Card'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px', fontWeight: '600' }}>유효기간</label>
              <input type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} className="neon-input" style={{ padding: '8px' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px', fontWeight: '600' }}>CVC</label>
              <input type="text" value={cardCvv} onChange={e => setCardCvv(e.target.value)} className="neon-input" style={{ padding: '8px' }} required />
            </div>
          </div>
          <button type="submit" disabled={isCharging} className="neon-btn btn-success" style={{ width: '100%', padding: '14px', marginTop: '4px' }}>
            {isCharging
              ? <><RefreshCw className="animate-spin" size={16} /> 카드 결제 승인 중...</>
              : <><Check size={16} /> {cardAmount.toLocaleString()} 원 결제 승인 및 코인 충전</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}

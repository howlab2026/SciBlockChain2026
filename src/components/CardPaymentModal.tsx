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

interface CardCompanyInfo {
  name: string;
  number: string;
  gradient: string;
  border: string;
  text: string;
  shadow: string;
}

const CARD_COMPANIES: CardCompanyInfo[] = [
  {
    name: '국민카드',
    number: '4311 9283 4821 0092',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #3b4252 100%)',
    border: '#0f172a',
    text: '#ffcc00',
    shadow: 'rgba(30,41,59,0.2)'
  },
  {
    name: '신한카드',
    number: '4518 3019 9283 1004',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #0047a0 100%)',
    border: '#002f6c',
    text: '#ffffff',
    shadow: 'rgba(0,71,160,0.2)'
  },
  {
    name: '토스페이',
    number: '5162 4920 1827 9283',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    border: '#172554',
    text: '#ffffff',
    shadow: 'rgba(29,78,216,0.2)'
  },
  {
    name: '카카오페이',
    number: '9420 1837 8422 9183',
    gradient: 'linear-gradient(135deg, #ffeb00 0%, #facc15 100%)',
    border: '#ca8a04',
    text: '#1e293b',
    shadow: 'rgba(250,204,21,0.2)'
  },
  {
    name: '하나카드',
    number: '3779 1928 3810 9221',
    gradient: 'linear-gradient(135deg, #008f82 0%, #005950 100%)',
    border: '#00332e',
    text: '#ffffff',
    shadow: 'rgba(0,143,130,0.2)'
  }
];

export function CardPaymentModal({
  show, onClose, visitor, blockchain, updateBlockchainState, autoMine, runMiningProcess, addToast
}: CardPaymentModalProps) {
  const [cardAmount, setCardAmount] = useState(10000);
  const [cardCompany, setCardCompany] = useState('국민카드');
  const [cardNumber, setCardNumber] = useState('4311 9283 4821 0092');
  const [cardExpiry, setCardExpiry] = useState('12/29');
  const [cardCvv, setCardCvv] = useState('382');
  const [isCharging, setIsCharging] = useState(false);

  if (!show) return null;

  const krwToCoin = (krw: number) => Math.floor(krw / 100);

  const currentCompany = CARD_COMPANIES.find(c => c.name === cardCompany) || CARD_COMPANIES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCharging(true);
    setTimeout(() => {
      const chargedCoins = krwToCoin(cardAmount);
      const tx = new Transaction(
        'CARD_PAYMENT',
        visitor.address,
        chargedCoins,
        `신용카드 코인 충전 (${cardAmount.toLocaleString()} 원)`
      );
      try {
        blockchain.current.addTransaction(tx);
        setIsCharging(false);
        onClose();
        updateBlockchainState();
        confetti({ particleCount: 50, spread: 40, colors: ['#0d9488', '#4f46e5'] });
        addToast('success', `${chargedCoins} 코인 충전 완료!`, `${cardAmount.toLocaleString()}원 결제 ➔ ${chargedCoins} 코인 지갑 반영`);
        if (autoMine) runMiningProcess();
      } catch (err: unknown) {
        setIsCharging(false);
        addToast('error', '결제 실패', err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
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
        border: '1px solid #bfdbfe',
        boxShadow: '0 8px 24px rgba(148,163,184,0.15)',
        animation: 'fadeIn 0.2s ease', background: '#ffffff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={20} color="#4f46e5" />
            가상 카드 결제 충전
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Credit Card Design Graphic */}
        <div style={{
          height: '170px',
          background: currentCompany.gradient,
          border: `1px solid ${currentCompany.border}`,
          borderRadius: '16px', padding: '20px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: `0 8px 20px ${currentCompany.shadow}`,
          color: currentCompany.text, position: 'relative', overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
            <span style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '0.5px' }}>{cardCompany}</span>
            <div style={{ width: '40px', height: '26px', background: currentCompany.text === '#1e293b' ? 'rgba(30,41,59,0.15)' : 'rgba(255,255,255,0.2)', borderRadius: '6px' }} />
          </div>
          <div style={{ width: '32px', height: '24px', background: currentCompany.text === '#1e293b' ? '#d97706' : '#fbbf24', borderRadius: '4px', opacity: 0.9, zIndex: 1 }} />
          <div style={{ zIndex: 1 }}>
            <div style={{ fontSize: '18px', letterSpacing: '2px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{cardNumber}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.85, marginTop: '8px' }}>
              <span>카드 소유자: {visitor.name}</span>
              <span>유효기간: {cardExpiry}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '6px', fontWeight: '600' }}>충전 금액 선택 (KRW)</label>
            <select value={cardAmount} onChange={e => setCardAmount(parseInt(e.target.value))} className="neon-input">
              {CARD_AMOUNTS.map(a => (
                <option key={a.krw} value={a.krw}>{a.krw.toLocaleString()} 원 (= {a.coins} 코인)</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px', fontWeight: '600' }}>발급사</label>
              <select 
                value={cardCompany} 
                onChange={e => {
                  const comp = e.target.value;
                  setCardCompany(comp);
                  const found = CARD_COMPANIES.find(c => c.name === comp);
                  if (found) {
                    setCardNumber(found.number);
                  }
                }} 
                className="neon-input" 
                style={{ padding: '8px' }}
              >
                {CARD_COMPANIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px', fontWeight: '600' }}>카드 번호</label>
              <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="neon-input" style={{ padding: '8px' }} required />
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

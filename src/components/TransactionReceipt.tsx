import { CheckCircle, Copy, Printer } from 'lucide-react';
import type { ReceiptData } from '../types';
import confetti from 'canvas-confetti';

interface TransactionReceiptProps {
  data: ReceiptData | null;
  onClose: () => void;
}

export function TransactionReceipt({ data, onClose }: TransactionReceiptProps) {
  if (!data) return null;

  const handleClose = () => {
    confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 }, colors: ['#10b981', '#3b82f6', '#8b5cf6'] });
    onClose();
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);
  const date = new Date(data.timestamp);

  const row = (label: string, value: string, mono = false, copyable = false) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '10px 0',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      gap: '12px',
    }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0, paddingTop: '2px' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', minWidth: 0, flex: 1, justifyContent: 'flex-end' }}>
        <span style={{
          fontSize: '12px', color: 'var(--text-dark)', fontWeight: '600',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          wordBreak: 'break-all', textAlign: 'right',
        }}>
          {value}
        </span>
        {copyable && (
          <button onClick={() => copy(value)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px 0 0 0', flexShrink: 0 }}>
            <Copy size={11} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="receipt-modal-overlay" style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999,
    }}>
      <div className="glass-card" style={{
        width: '440px', maxHeight: '90vh', overflow: 'auto',
        padding: '0',
        border: '1px solid rgba(16,185,129,0.3)',
        boxShadow: '0 20px 60px rgba(16,185,129,0.15)',
        animation: 'fadeIn 0.25s ease',
        borderRadius: '20px',
      }}>
        <div style={{
          padding: '28px 28px 20px',
          background: 'rgba(16,185,129,0.06)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(16,185,129,0.1)',
            border: '2px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle size={28} color="#0d9488" />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)' }}>결제 완료!</h3>
            <p style={{ fontSize: '13px', color: '#0d9488', marginTop: '4px', fontWeight: '600' }}>블록체인에 영구 기록되었습니다</p>
          </div>
          <div style={{
            fontSize: '36px', fontWeight: '800', color: 'var(--text-dark)',
          }}>
            {data.amount.toLocaleString()} <span style={{ fontSize: '18px', color: '#0d9488', fontWeight: '700' }}>{data.coinName}</span>
          </div>
        </div>

        <div style={{ padding: '20px 28px' }}>
          {row('목적', data.purpose)}
          {row('TX 해시', data.txId, true, true)}
          {row('송신자', data.fromAddress, true)}
          {row('수신자', data.toAddress, true)}
          {row('블록 번호', `#${data.blockIndex}`)}
          {row('시간', `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`)}

          <div style={{
            margin: '16px 0',
            borderTop: '2px dashed rgba(0,0,0,0.08)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)',
              padding: '0 12px', background: 'var(--bg-panel)',
              fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase',
            }}>SciBlockChain</div>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              onClick={() => window.print()}
              className="neon-btn btn-secondary"
              style={{ flex: 1, padding: '12px', fontSize: '13px' }}
            >
              <Printer size={14} />
              영수증 인쇄
            </button>
            <button onClick={handleClose} className="neon-btn btn-success" style={{ flex: 1, padding: '12px', fontSize: '13px' }}>
              <CheckCircle size={14} />
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

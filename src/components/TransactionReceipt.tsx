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
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      gap: '12px',
    }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          fontSize: '12px', color: 'white', fontWeight: '600',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          wordBreak: 'break-all', textAlign: 'right',
        }}>
          {value}
        </span>
        {copyable && (
          <button onClick={() => copy(value)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0' }}>
            <Copy size={11} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
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
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.1))',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(16,185,129,0.2)',
            border: '2px solid rgba(16,185,129,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle size={28} color="#10b981" />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>Payment Completed!</h3>
            <p style={{ fontSize: '13px', color: '#34d399', marginTop: '4px' }}>Permanently recorded on blockchain</p>
          </div>
          <div style={{
            fontSize: '36px', fontWeight: '800', color: 'white',
            textShadow: '0 0 20px rgba(16,185,129,0.4)',
          }}>
            {data.amount.toLocaleString()} <span style={{ fontSize: '18px', color: '#34d399' }}>{data.coinName}</span>
          </div>
        </div>

        <div style={{ padding: '20px 28px' }}>
          {row('Purpose', data.purpose)}
          {row('TX Hash', data.txId.substring(0, 20) + '...', true, true)}
          {row('From', data.fromAddress, true)}
          {row('To', data.toAddress, true)}
          {row('Block Number', `#${data.blockIndex}`)}
          {row('Time', `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`)}

          <div style={{
            margin: '16px 0',
            borderTop: '2px dashed rgba(255,255,255,0.08)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)',
              padding: '0 12px', background: 'var(--bg-panel)',
              fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase',
            }}>SciBlockChain</div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              onClick={() => window.print()}
              className="neon-btn btn-secondary"
              style={{ flex: 1, padding: '12px', fontSize: '13px' }}
            >
              <Printer size={14} />
              Print Receipt
            </button>
            <button onClick={handleClose} className="neon-btn btn-success" style={{ flex: 1, padding: '12px', fontSize: '13px' }}>
              <CheckCircle size={14} />
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

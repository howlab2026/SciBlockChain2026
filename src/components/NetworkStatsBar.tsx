import React from 'react';
import { Server, Cpu, Coins, CheckCircle, ShieldAlert, Activity } from 'lucide-react';
import { Blockchain } from '../blockchain';

interface NetworkStatsBarProps {
  blockchainRef: React.MutableRefObject<Blockchain>;
  blockchainTick: number;
  isChainHealthy: boolean;
  isMining: boolean;
  miningProgress: number;
}

export function NetworkStatsBar({
  blockchainRef, blockchainTick: _tick, isChainHealthy, isMining, miningProgress
}: NetworkStatsBarProps) {
  const bc = blockchainRef.current;
  const stats = bc.getBlockStats();
  const chainLen = bc.chain.length;
  const pendingCount = bc.pendingTransactions.length;
  const avgMs = stats.avgBlockTime;
  const avgStr = avgMs > 0
    ? (avgMs < 1000 ? `${avgMs.toFixed(0)}ms` : `${(avgMs / 1000).toFixed(1)}s`)
    : '—';

  const statItem = (icon: React.ReactNode, label: string, value: string, color: string) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1 }}>{label}</div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'white', lineHeight: 1.3 }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div style={{
      margin: '0 16px 12px',
      padding: '8px 16px',
      background: 'rgba(7,9,19,0.6)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap',
      overflowX: 'auto',
    }}>
      {statItem(<Server size={12} />, 'Total Blocks', `${chainLen} Blocks`, '#60a5fa')}
      {statItem(<Activity size={12} />, 'Total TX', `${stats.totalTxCount} TXs`, '#a78bfa')}
      {statItem(<Cpu size={12} />, 'Mempool', `${pendingCount} Pending`, '#fbbf24')}
      {statItem(<Coins size={12} />, 'Avg Block Time', avgStr, '#34d399')}
      {statItem(<Coins size={12} />, 'Difficulty', `${bc.difficulty}`, '#f9a8d4')}

      {isMining && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(59,130,246,0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(59,130,246,0.25)',
          flex: 1,
          minWidth: '160px',
        }}>
          <Cpu size={12} color="#60a5fa" className="animate-pulse" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: '#60a5fa' }}>Mining Block...</div>
            <div style={{
              marginTop: '3px',
              height: '4px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${miningProgress}%`,
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                borderRadius: '2px',
                transition: 'width 0.2s ease',
              }} />
            </div>
          </div>
          <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '700' }}>{miningProgress}%</span>
        </div>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {isChainHealthy
          ? <><CheckCircle size={12} color="#10b981" /><span style={{ fontSize: '11px', color: '#34d399', fontWeight: '600' }}>Chain Valid</span></>
          : <><ShieldAlert size={12} color="#ef4444" className="animate-pulse" /><span style={{ fontSize: '11px', color: '#f87171', fontWeight: '600' }}>Tampering Detected</span></>
        }
      </div>
    </div>
  );
}

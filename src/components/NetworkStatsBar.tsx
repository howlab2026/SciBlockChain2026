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
      background: '#ffffff',
      borderRadius: '10px',
      border: '1px solid rgba(226,232,240,0.8)',
      boxShadow: '0 2px 6px rgba(148,163,184,0.06)'
    }}>
      <span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1 }}>{label}</div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', lineHeight: 1.3 }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div style={{
      margin: '0 16px 12px',
      padding: '8px 16px',
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(226,232,240,0.8)',
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap',
      overflowX: 'auto',
      boxShadow: '0 4px 15px rgba(148,163,184,0.08)'
    }}>
      {statItem(<Server size={12} />, '총 블록', `${chainLen}개`, '#4f46e5')}
      {statItem(<Activity size={12} />, '총 TX', `${stats.totalTxCount}건`, '#7c3aed')}
      {statItem(<Cpu size={12} />, '멤풀', `${pendingCount}건`, '#d97706')}
      {statItem(<Coins size={12} />, '평균 블록 시간', avgStr, '#0d9488')}
      {statItem(<Coins size={12} />, '난이도', `${bc.difficulty}`, '#db2777')}

      {isMining && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(99,102,241,0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(99,102,241,0.3)',
          flex: 1,
          minWidth: '160px',
        }}>
          <Cpu size={12} color="#4f46e5" className="animate-pulse" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: '#4338ca', fontWeight: '600' }}>채굴 진행 중</div>
            <div style={{
              marginTop: '3px',
              height: '4px',
              background: 'rgba(226,232,240,0.8)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${miningProgress}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                borderRadius: '2px',
                transition: 'width 0.2s ease',
              }} />
            </div>
          </div>
          <span style={{ fontSize: '11px', color: '#4338ca', fontWeight: '700' }}>{miningProgress}%</span>
        </div>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {isChainHealthy
          ? <><CheckCircle size={12} color="#0d9488" /><span style={{ fontSize: '11px', color: '#0f766e', fontWeight: '600' }}>체인 정상</span></>
          : <><ShieldAlert size={12} color="#dc2626" className="animate-pulse" /><span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '600' }}>위변조 감지</span></>
        }
      </div>
    </div>
  );
}

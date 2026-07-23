import React, { useMemo } from 'react';
import { BarChart2, TrendingUp, Users, Zap, Activity, Download, Wallet, CreditCard, ShoppingBag, List } from 'lucide-react';
import { Blockchain } from '../blockchain';
import type { Booth, VisitorWallet } from '../types';

const formatPurpose = (purpose: string, fromAddress: string, toAddress: string, currentAddress: string) => {
  if (fromAddress.startsWith('0xVisitor') && toAddress.startsWith('0xVisitor')) {
    const isIncoming = toAddress === currentAddress;
    return isIncoming ? purpose.replace('송금', '입금') : purpose.replace('입금', '송금');
  }
  return purpose;
};

interface AnalyticsTabProps {
  blockchainRef: React.MutableRefObject<Blockchain>;
  blockchainTick: number;
  booths: Booth[];
  isAdmin: boolean;
  currentVisitor?: VisitorWallet;
}

function arcPath(cx: number, cy: number, r: number, ri: number, sa: number, ea: number): string {
  if (Math.abs(ea - sa) >= 2 * Math.PI - 0.001) {
    const mid = sa + Math.PI;
    const p1 = arcPath(cx, cy, r, ri, sa, mid);
    const p2 = arcPath(cx, cy, r, ri, mid, ea - 0.001);
    return `${p1} ${p2}`;
  }
  const cos = Math.cos, sin = Math.sin;
  const sx = cx + r * cos(sa), sy = cy + r * sin(sa);
  const ex = cx + r * cos(ea), ey = cy + r * sin(ea);
  const si = { x: cx + ri * cos(ea), y: cy + ri * sin(ea) };
  const ei = { x: cx + ri * cos(sa), y: cy + ri * sin(sa) };
  const lg = ea - sa > Math.PI ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${lg} 1 ${ex} ${ey} L ${si.x} ${si.y} A ${ri} ${ri} 0 ${lg} 0 ${ei.x} ${ei.y} Z`;
}

function DonutChart({ segments, centerLabel = "Total TX" }: { segments: { label: string; value: number; color: string }[]; centerLabel?: string }) {
  const total = segments.reduce((s, g) => s + g.value, 0);
  if (total === 0) return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      <circle cx={90} cy={90} r={70} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={28} />
      <text x={90} y={90} textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" fontSize={12}>데이터 없음</text>
    </svg>
  );
  const start = -Math.PI / 2;
  let current = start;

  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      <defs>
        {segments.map((seg, i) => (
          <linearGradient key={i} id={`dg${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={seg.color} stopOpacity={1} />
            <stop offset="100%" stopColor={seg.color} stopOpacity={0.7} />
          </linearGradient>
        ))}
      </defs>
      {segments.map((seg, i) => {
        if (seg.value === 0) return null;
        const angle = (seg.value / total) * 2 * Math.PI;
        const path = arcPath(90, 90, 78, 50, current, current + angle);
        current += angle;
        return <path key={i} d={path} fill={`url(#dg${i})`} stroke="#ffffff" strokeWidth={1.5} />;
      })}
      <text x={90} y={84} textAnchor="middle" dominantBaseline="middle" fill="var(--text-dark)" fontSize={22} fontWeight="bold" fontFamily="Outfit, sans-serif">{total}</text>
      <text x={90} y={102} textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" fontSize={10}>{centerLabel}</text>
    </svg>
  );
}

function BarChart({ items, maxWidth = 320 }: { items: { label: string; value: number; color: string }[]; maxWidth?: number }) {
  const maxVal = Math.max(...items.map(i => i.value), 1);
  const bh = 26;
  const gap = 10;
  const totalH = items.length * (bh + gap) + 10;

  if (items.every(i => i.value === 0)) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px' }}>거래 내역이 아직 없습니다.</div>
  );

  return (
    <svg width={maxWidth} height={totalH} viewBox={`0 0 ${maxWidth} ${totalH}`} style={{ width: '100%' }}>
      <defs>
        {items.map((item, i) => (
          <linearGradient key={i} id={`bg${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={item.color} stopOpacity={0.8} />
            <stop offset="100%" stopColor={item.color} stopOpacity={0.4} />
          </linearGradient>
        ))}
      </defs>
      {items.map((item, i) => {
        const barW = (item.value / maxVal) * (maxWidth - 130);
        const y = i * (bh + gap) + 5;
        return (
          <g key={i}>
            <text x={100} y={y + bh / 2 + 1} textAnchor="end" dominantBaseline="middle" fill="var(--text-muted)" fontSize={10} fontFamily="Outfit, sans-serif">
              {item.label.length > 11 ? item.label.substring(0, 11) + '..' : item.label}
            </text>
            <rect x={104} y={y} width={Math.max(barW, item.value > 0 ? 4 : 0)} height={bh} fill={`url(#bg${i})`} rx={4} />
            {item.value > 0 && (
              <text x={110 + barW} y={y + bh / 2 + 1} dominantBaseline="middle" fill="var(--text-dark)" fontSize={11} fontWeight="bold" fontFamily="Outfit, sans-serif">
                {item.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function BlockActivityChart({ bc }: { bc: Blockchain }) {
  const blocks = bc.chain.slice(1);
  if (blocks.length === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px' }}>채굴된 블록이 아직 없습니다.</div>;
  }
  const values = blocks.map(b => b.transactions.length);
  const maxVal = Math.max(...values, 1);
  const W = 440, H = 100, pad = 30;
  const step = (W - pad * 2) / Math.max(blocks.length - 1, 1);

  const points = values.map((v, i) => ({
    x: pad + i * step,
    y: H - pad - ((v / maxVal) * (H - pad * 2))
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${H - pad} L ${points[0].x} ${H - pad} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
      <defs>
        <linearGradient id="lineArea" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#lineArea)" />
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#3b82f6" stroke="#ffffff" strokeWidth={2} />
          <text x={p.x} y={H - 8} textAnchor="middle" fill="var(--text-muted)" fontSize={9} fontFamily="Outfit, sans-serif">
            #{blocks[i].index}
          </text>
          <text x={p.x} y={p.y - 8} textAnchor="middle" fill="var(--text-dark)" fontSize={9} fontWeight="bold" fontFamily="Outfit, sans-serif">
            {values[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function AnalyticsTab({ blockchainRef, blockchainTick: _tick, booths, isAdmin, currentVisitor }: AnalyticsTabProps) {
  const bc = blockchainRef.current;
  const coinName = bc.coinName;

  const adminAnalytics = useMemo(() => {
    if (!isAdmin) return null;
    let cardVolume = 0, boothVolume = 0, miningVolume = 0, genesisVolume = 0;
    const boothRevenue: Record<string, number> = {};
    booths.forEach(b => { boothRevenue[b.id] = 0; });

    bc.chain.forEach(block => {
      block.transactions.forEach(tx => {
        if (tx.fromAddress === 'SYSTEM' && tx.purpose !== 'Mining Reward') genesisVolume += tx.amount;
        else if (tx.fromAddress === 'CARD_PAYMENT') cardVolume += tx.amount;
        else if (tx.purpose === 'Mining Reward') miningVolume += tx.amount;
        else if (tx.toAddress.startsWith('0xBooth')) { 
          boothVolume += tx.amount; 
          boothRevenue[tx.toAddress] = (boothRevenue[tx.toAddress] || 0) + tx.amount; 
        }
      });
    });

    const totalVolume = cardVolume + boothVolume + miningVolume;
    const stats = bc.getBlockStats();
    const mostPopular = booths.reduce((best, b) => (boothRevenue[b.id] || 0) > (boothRevenue[best.id] || 0) ? b : best, booths[0]);

    return { cardVolume, boothVolume, miningVolume, genesisVolume, boothRevenue, totalVolume, stats, mostPopular };
  }, [bc, _tick, booths, isAdmin]);

  const visitorAnalytics = useMemo(() => {
    if (isAdmin || !currentVisitor) return null;
    const addr = currentVisitor.address;
    let totalCharged = 0;
    let totalSpent = 0;
    let totalReceivedTransfer = 0;
    let totalSentTransfer = 0;
    const boothSpent: Record<string, number> = {};
    booths.forEach(b => { boothSpent[b.id] = 0; });

    let cardTxCount = 0;
    let boothTxCount = 0;
    let transferTxCount = 0;
    const myTransactions: any[] = [];

    bc.chain.forEach(block => {
      block.transactions.forEach(tx => {
        const isFromMe = tx.fromAddress === addr;
        const isToMe = tx.toAddress === addr;

        if (isFromMe || isToMe) {
          myTransactions.push({
            id: tx.id,
            fromAddress: tx.fromAddress,
            toAddress: tx.toAddress,
            amount: tx.amount,
            purpose: tx.purpose,
            timestamp: tx.timestamp,
            blockIndex: block.index
          });

          if (tx.fromAddress === 'CARD_PAYMENT' && isToMe) {
            totalCharged += tx.amount;
            cardTxCount++;
          } else if (tx.toAddress.startsWith('0xBooth') && isFromMe) {
            totalSpent += tx.amount;
            boothSpent[tx.toAddress] = (boothSpent[tx.toAddress] || 0) + tx.amount;
            boothTxCount++;
          } else {
            if (isFromMe) totalSentTransfer += tx.amount;
            if (isToMe) totalReceivedTransfer += tx.amount;
            transferTxCount++;
          }
        }
      });
    });

    myTransactions.sort((a, b) => b.timestamp - a.timestamp);
    const currentBalance = bc.getBalanceOfAddress(addr);
    const visitedBoothsCount = Object.values(boothSpent).filter(v => v > 0).length;

    return {
      totalCharged, totalSpent, totalSentTransfer, totalReceivedTransfer,
      boothSpent, currentBalance, visitedBoothsCount,
      cardTxCount, boothTxCount, transferTxCount, myTransactions
    };
  }, [bc, _tick, booths, isAdmin, currentVisitor]);

  const handleExport = () => {
    const json = bc.exportChainData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sciblockchain_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpiCard = (icon: React.ReactNode, label: string, value: string, sub?: string, color = 'var(--neon-blue)') => (
    <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff' }}>
      <div style={{ color, display: 'flex', alignItems: 'center', padding: '10px', background: 'rgba(0,0,0,0.04)', borderRadius: '10px' }}>{icon}</div>
      <div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</span>
        <h4 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-dark)', lineHeight: 1.2 }}>{value}</h4>
        {sub && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '500' }}>{sub}</span>}
      </div>
    </div>
  );

  // === ADMIN VIEW RENDER ===
  if (isAdmin && adminAnalytics) {
    const boothBarItems = booths.map((b, i) => ({
      label: b.name,
      value: adminAnalytics.boothRevenue[b.id] || 0,
      color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4'][i % 6],
    }));

    const donutSegments = [
      { label: '카드 충전', value: bc.chain.reduce((s, b) => s + b.transactions.filter(tx => tx.fromAddress === 'CARD_PAYMENT').length, 0), color: '#f59e0b' },
      { label: '부스 결제', value: bc.chain.reduce((s, b) => s + b.transactions.filter(tx => tx.toAddress.startsWith('0xBooth')).length, 0), color: '#10b981' },
      { label: '채굴 보상', value: bc.chain.reduce((s, b) => s + b.transactions.filter(tx => tx.purpose === 'Mining Reward').length, 0), color: '#8b5cf6' },
      { label: '시스템', value: bc.chain.reduce((s, b) => s + b.transactions.filter(tx => tx.fromAddress === 'SYSTEM' && tx.purpose !== 'Mining Reward').length, 0), color: '#3b82f6' },
    ];

    return (
      <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {kpiCard(<BarChart2 size={24} />, '전체 거래량', `${adminAnalytics.totalVolume.toLocaleString()} ${coinName.substring(0, 5)}`, `카드: ${adminAnalytics.cardVolume} | 부스: ${adminAnalytics.boothVolume}`, 'var(--neon-blue)')}
          {kpiCard(<Activity size={24} />, '전체 TX 건수', `${adminAnalytics.stats.totalTxCount} 건`, undefined, '#8b5cf6')}
          {kpiCard(<Users size={24} />, '채굴 보상 지급량', `${adminAnalytics.miningVolume} 코인`, `채굴 ${bc.chain.length - 1}회 진행`, '#f59e0b')}
          {kpiCard(<TrendingUp size={24} />, '인기 체험 부스', adminAnalytics.mostPopular?.name || '—', adminAnalytics.mostPopular ? `${adminAnalytics.boothRevenue[adminAnalytics.mostPopular.id] || 0} 코인` : undefined, '#10b981')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '22px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <BarChart2 size={16} color="var(--neon-blue)" /> 부스별 누적 수익
            </h3>
            <BarChart items={boothBarItems.length > 0 ? boothBarItems : [{ label: 'No Data', value: 0, color: '#3b82f6' }]} />
            <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {boothBarItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'var(--text-muted)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
                  {item.label} ({item.value} 코인)
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '22px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Activity size={16} color="var(--neon-purple)" /> 전체 트랜잭션 유형 분포
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <DonutChart segments={donutSegments} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {donutSegments.map((seg, i) => {
                  const total = donutSegments.reduce((s, g) => s + g.value, 0);
                  const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: seg.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dark)', fontWeight: '600' }}>{seg.label}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{seg.value} TXs ({pct}%)</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '22px', background: '#ffffff' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Zap size={16} color="var(--neon-yellow)" /> 블록별 처리 트랜잭션 수
          </h3>
          <BlockActivityChart bc={bc} />
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>블록체인 데이터 내보내기</h4>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>전체 원장 데이터를 JSON 파일로 다운로드합니다.</p>
          </div>
          <button onClick={handleExport} className="neon-btn btn-secondary" style={{ padding: '10px 20px' }}>
            <Download size={14} /> JSON 내보내기
          </button>
        </div>
      </div>
    );
  }

  // === VISITOR VIEW RENDER ===
  if (!isAdmin && visitorAnalytics && currentVisitor) {
    const boothSpentItems = booths.map((b, i) => ({
      label: b.name,
      value: visitorAnalytics.boothSpent[b.id] || 0,
      color: ['#0d9488', '#3b82f6', '#7c3aed', '#f59e0b', '#db2777', '#06b6d4'][i % 6],
    }));

    const donutSegments = [
      { label: '카드 충전', value: visitorAnalytics.cardTxCount, color: '#f59e0b' },
      { label: '부스 결제', value: visitorAnalytics.boothTxCount, color: '#0d9488' },
      { label: '기타 송금', value: visitorAnalytics.transferTxCount, color: '#7c3aed' },
    ];

    const maxSpentBoothId = Object.keys(visitorAnalytics.boothSpent).reduce(
      (best, id) => (visitorAnalytics.boothSpent[id] || 0) > (visitorAnalytics.boothSpent[best] || 0) ? id : best,
      booths[0]?.id
    );
    const maxSpentBooth = booths.find(b => b.id === maxSpentBoothId);
    const maxSpentAmount = visitorAnalytics.boothSpent[maxSpentBoothId] || 0;

    return (
      <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Visitor Personal KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {kpiCard(<Wallet size={24} />, `${currentVisitor.name} 님의 현재 잔액`, `${visitorAnalytics.currentBalance.toLocaleString()} 코인`, `지갑 주소: ${currentVisitor.address.substring(0, 12)}...`, 'var(--neon-blue)')}
          {kpiCard(<CreditCard size={24} />, '총 충전액 (가상카드)', `${visitorAnalytics.totalCharged.toLocaleString()} 코인`, `충전 횟수: ${visitorAnalytics.cardTxCount}회`, '#f59e0b')}
          {kpiCard(<ShoppingBag size={24} />, '총 체험 소비액', `${visitorAnalytics.totalSpent.toLocaleString()} 코인`, `부스 결제: ${visitorAnalytics.boothTxCount}회`, '#0d9488')}
          {kpiCard(<TrendingUp size={24} />, '최다 코인 사용 부스', maxSpentAmount > 0 && maxSpentBooth ? maxSpentBooth.name : '없음', maxSpentAmount > 0 ? `${maxSpentAmount} 코인 사용` : undefined, '#7c3aed')}
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Spent per Booth Bar Chart */}
          <div className="glass-card" style={{ padding: '22px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <BarChart2 size={16} color="#0d9488" /> 나의 부스별 코인 사용액
            </h3>
            <BarChart items={boothSpentItems} />
            <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {boothSpentItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'var(--text-muted)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
                  {item.label} ({item.value} 코인)
                </div>
              ))}
            </div>
          </div>

          {/* Personal Tx Type Distribution Donut Chart */}
          <div className="glass-card" style={{ padding: '22px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Activity size={16} color="#7c3aed" /> 나의 트랜잭션 분포
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <DonutChart segments={donutSegments} centerLabel="나의 거래" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {donutSegments.map((seg, i) => {
                  const total = donutSegments.reduce((s, g) => s + g.value, 0);
                  const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: seg.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dark)', fontWeight: '600' }}>{seg.label}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{seg.value}건 ({pct}%)</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Visitor Recent Transactions List */}
        <div className="glass-card" style={{ padding: '22px', background: '#ffffff' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <List size={16} color="var(--neon-blue)" /> 나의 개인 결제 &amp; 거래 내역 (최근 순)
          </h3>
          {visitorAnalytics.myTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '32px' }}>
              트랜잭션 기록이 없습니다. 부스 결제나 카드 충전을 해보세요!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)', fontWeight: '600' }}>
                    <th style={{ padding: '10px 8px' }}>블록</th>
                    <th style={{ padding: '10px 8px' }}>목적 / 거래 유형</th>
                    <th style={{ padding: '10px 8px' }}>송신자</th>
                    <th style={{ padding: '10px 8px' }}>수신자</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>금액</th>
                    <th style={{ padding: '10px 8px' }}>시간</th>
                  </tr>
                </thead>
                <tbody>
                  {visitorAnalytics.myTransactions.map((tx) => {
                    const isSpent = tx.fromAddress === currentVisitor.address;
                    const date = new Date(tx.timestamp);
                    const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9', color: 'var(--text-main)' }}>
                        <td style={{ padding: '10px 8px', color: '#3b82f6', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>#{tx.blockIndex}</td>
                        <td style={{ padding: '10px 8px', fontWeight: '600' }}>
                          {formatPurpose(tx.purpose, tx.fromAddress, tx.toAddress, currentVisitor?.address || '')}
                        </td>
                        <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {tx.fromAddress === currentVisitor.address ? '내 지갑' : tx.fromAddress}
                        </td>
                        <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {tx.toAddress === currentVisitor.address ? '내 지갑' : tx.toAddress}
                        </td>
                        <td style={{
                          padding: '10px 8px',
                          textAlign: 'right',
                          fontWeight: '800',
                          fontSize: '13px',
                          color: isSpent ? '#dc2626' : '#0d9488'
                        }}>
                          {isSpent ? '-' : '+'}{tx.amount.toLocaleString()} 코인
                        </td>
                        <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{formattedDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

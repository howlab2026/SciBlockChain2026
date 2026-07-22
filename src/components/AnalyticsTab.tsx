import React, { useMemo } from 'react';
import { BarChart2, TrendingUp, Users, Zap, Activity, Download } from 'lucide-react';
import { Blockchain } from '../blockchain';
import type { Booth } from '../types';

interface AnalyticsTabProps {
  blockchainRef: React.MutableRefObject<Blockchain>;
  blockchainTick: number;
  booths: Booth[];
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

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, g) => s + g.value, 0);
  if (total === 0) return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      <circle cx={90} cy={90} r={70} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={28} />
      <text x={90} y={90} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.3)" fontSize={12}>No Data</text>
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
        return <path key={i} d={path} fill={`url(#dg${i})`} stroke="var(--bg-dark)" strokeWidth={1.5} />;
      })}
      <text x={90} y={84} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={22} fontWeight="bold" fontFamily="Outfit, sans-serif">{total}</text>
      <text x={90} y={102} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.45)" fontSize={10}>Total TX</text>
    </svg>
  );
}

function BarChart({ items, maxWidth = 320 }: { items: { label: string; value: number; color: string }[]; maxWidth?: number }) {
  const maxVal = Math.max(...items.map(i => i.value), 1);
  const bh = 26;
  const gap = 10;
  const totalH = items.length * (bh + gap) + 10;

  if (items.every(i => i.value === 0)) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px' }}>No transaction data yet.</div>
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
            <text x={100} y={y + bh / 2 + 1} textAnchor="end" dominantBaseline="middle" fill="rgba(255,255,255,0.55)" fontSize={10} fontFamily="Outfit, sans-serif">
              {item.label.length > 11 ? item.label.substring(0, 11) + '..' : item.label}
            </text>
            <rect x={104} y={y} width={Math.max(barW, item.value > 0 ? 4 : 0)} height={bh} fill={`url(#bg${i})`} rx={4} />
            {item.value > 0 && (
              <text x={110 + barW} y={y + bh / 2 + 1} dominantBaseline="middle" fill="white" fontSize={11} fontWeight="bold" fontFamily="Outfit, sans-serif">
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
    return <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '24px' }}>No mined blocks yet.</div>;
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
          <circle cx={p.x} cy={p.y} r={4} fill="#3b82f6" stroke="var(--bg-dark)" strokeWidth={2} />
          <text x={p.x} y={H - 8} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={9} fontFamily="Outfit, sans-serif">
            #{blocks[i].index}
          </text>
          <text x={p.x} y={p.y - 8} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold" fontFamily="Outfit, sans-serif">
            {values[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function AnalyticsTab({ blockchainRef, blockchainTick: _tick, booths }: AnalyticsTabProps) {
  const bc = blockchainRef.current;
  const coinName = bc.coinName;

  const analytics = useMemo(() => {
    let cardVolume = 0, boothVolume = 0, miningVolume = 0, genesisVolume = 0;
    const boothRevenue: Record<string, number> = {};
    booths.forEach(b => { boothRevenue[b.id] = 0; });

    bc.chain.forEach(block => {
      block.transactions.forEach(tx => {
        if (tx.fromAddress === 'SYSTEM' && tx.purpose !== 'Mining Reward') genesisVolume += tx.amount;
        else if (tx.fromAddress === 'CARD_PAYMENT') cardVolume += tx.amount;
        else if (tx.purpose === 'Mining Reward') miningVolume += tx.amount;
        else if (tx.toAddress.startsWith('0xBooth')) { boothVolume += tx.amount; boothRevenue[tx.toAddress] = (boothRevenue[tx.toAddress] || 0) + tx.amount; }
      });
    });

    const totalVolume = cardVolume + boothVolume + miningVolume;
    const stats = bc.getBlockStats();

    return { cardVolume, boothVolume, miningVolume, genesisVolume, boothRevenue, totalVolume, stats };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_tick, booths]);

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

  const boothBarItems = booths.map((b, i) => ({
    label: b.name,
    value: analytics.boothRevenue[b.id] || 0,
    color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4'][i % 6],
  }));

  const donutSegments = [
    { label: 'Card Payment', value: bc.chain.reduce((s, b) => s + b.transactions.filter(tx => tx.fromAddress === 'CARD_PAYMENT').length, 0), color: '#f59e0b' },
    { label: 'Booth Payment', value: bc.chain.reduce((s, b) => s + b.transactions.filter(tx => tx.toAddress.startsWith('0xBooth')).length, 0), color: '#10b981' },
    { label: 'Mining Reward', value: bc.chain.reduce((s, b) => s + b.transactions.filter(tx => tx.purpose === 'Mining Reward').length, 0), color: '#8b5cf6' },
    { label: 'System', value: bc.chain.reduce((s, b) => s + b.transactions.filter(tx => tx.fromAddress === 'SYSTEM' && tx.purpose !== 'Mining Reward').length, 0), color: '#3b82f6' },
  ];

  const kpiCard = (icon: React.ReactNode, label: string, value: string, sub?: string, color = 'var(--neon-blue)') => (
    <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ color, display: 'flex', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>{icon}</div>
      <div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
        <h4 style={{ fontSize: '22px', fontWeight: '800', color: 'white', lineHeight: 1.2 }}>{value}</h4>
        {sub && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sub}</span>}
      </div>
    </div>
  );

  const mostPopular = booths.reduce((best, b) => (analytics.boothRevenue[b.id] || 0) > (analytics.boothRevenue[best.id] || 0) ? b : best, booths[0]);

  return (
    <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {kpiCard(<BarChart2 size={24} />, 'Total Volume', `${analytics.totalVolume.toLocaleString()} ${coinName.substring(0, 5)}`, `Card: ${analytics.cardVolume} | Booth: ${analytics.boothVolume}`, 'var(--neon-blue)')}
        {kpiCard(<Activity size={24} />, 'Total TX Count', `${analytics.stats.totalTxCount} TXs`, undefined, '#8b5cf6')}
        {kpiCard(<Users size={24} />, 'Mining Rewards Paid', `${analytics.miningVolume} Coins`, `${bc.chain.length - 1} Blocks Mined`, '#f59e0b')}
        {kpiCard(<TrendingUp size={24} />, 'Top Booth', mostPopular?.name || '—', mostPopular ? `${analytics.boothRevenue[mostPopular.id] || 0} Coins` : undefined, '#10b981')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        <div className="glass-card" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <BarChart2 size={16} color="var(--neon-blue)" /> Revenue per Booth
          </h3>
          <BarChart items={boothBarItems.length > 0 ? boothBarItems : [{ label: 'No Data', value: 0, color: '#3b82f6' }]} />
          <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {boothBarItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'var(--text-muted)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
                {item.label.substring(0, 10)} ({item.value} Coins)
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Activity size={16} color="var(--neon-purple)" /> Transaction Types Distribution
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
                      <div style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{seg.label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{seg.value} TXs ({pct}%)</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Zap size={16} color="var(--neon-yellow)" /> Block Throughput &amp; Activity
        </h3>
        <BlockActivityChart bc={bc} />
      </div>

      <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Export Blockchain Data</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>Download full ledger data as a JSON file.</p>
        </div>
        <button onClick={handleExport} className="neon-btn btn-secondary" style={{ padding: '10px 20px' }}>
          <Download size={14} /> Export JSON
        </button>
      </div>
    </div>
  );
}

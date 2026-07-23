import React, { useState, useMemo } from 'react';
import {
  Server, Cpu, Coins, CheckCircle, ShieldAlert, AlertTriangle, Play,
  RefreshCw, Search, X, CheckCircle2
} from 'lucide-react';
import { Blockchain } from '../blockchain';
import type { ToastType } from '../hooks/useToast';

interface ExplorerTabProps {
  blockchainRef: React.MutableRefObject<Blockchain>;
  blockchainTick: number;
  difficulty: number;
  miningReward: number;
  isMining: boolean;
  miningProgress: number;
  isChainHealthy: boolean;
  originalTransactions: Record<string, number>;
  setOriginalTransactions: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  runMiningProcess: () => Promise<void>;
  reMineChainFrom: (index: number) => Promise<void>;
  addToast: (type: ToastType, title: string, message?: string) => void;
  updateBlockchainState: () => void;
}

type TxFilter = 'all' | 'card' | 'booth' | 'mining' | 'system';

export function ExplorerTab({
  blockchainRef, blockchainTick: _tick, difficulty: _difficulty, miningReward,
  isMining, miningProgress, isChainHealthy,
  originalTransactions, setOriginalTransactions,
  runMiningProcess, reMineChainFrom, addToast, updateBlockchainState,
}: ExplorerTabProps) {
  const bc = blockchainRef.current;
  const coinName = bc.coinName;

  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [detailedBlockIndex, setDetailedBlockIndex] = useState<number | null>(null);
  const [tamperingBlockIndex, setTamperingBlockIndex] = useState<number | null>(null);
  const [tamperingTxId, setTamperingTxId] = useState('');
  const [tamperedAmount, setTamperedAmount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [txFilter, setTxFilter] = useState<TxFilter>('all');

  const handleTamper = (blockIndex: number, txId: string, originalAmt: number) => {
    if (!(txId in originalTransactions)) {
      setOriginalTransactions(prev => ({ ...prev, [txId]: originalAmt }));
    }
    setTamperingBlockIndex(blockIndex);
    setTamperingTxId(txId);
    setTamperedAmount(originalTransactions[txId] ?? originalAmt);
  };

  const executeTampering = () => {
    if (tamperingBlockIndex === null || !tamperingTxId) return;
    const block = bc.chain[tamperingBlockIndex];
    const tx = block.transactions.find(t => t.id === tamperingTxId);
    if (tx) {
      tx.amount = tamperedAmount;
      updateBlockchainState();
      addToast('warning', '위조 실행!', `블록 #${tamperingBlockIndex} TX가 위조되었습니다. 체인 유효성을 확인하세요.`);
    }
    setTamperingBlockIndex(null);
    setTamperingTxId('');
  };

  const restoreTransaction = (blockIndex: number, txId: string) => {
    const originalAmt = originalTransactions[txId];
    if (originalAmt === undefined) return;
    const block = bc.chain[blockIndex];
    const tx = block.transactions.find(t => t.id === txId);
    if (tx) { tx.amount = originalAmt; updateBlockchainState(); addToast('success', '원상복원 완료', '트랜잭션 금액이 원래 값으로 복원되었습니다.'); }
  };

  const allTxs = useMemo(() => {
    return bc.chain.flatMap((block, bi) =>
      block.transactions.map(tx => ({ ...tx, blockIndex: bi }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_tick]);

  const filteredTxs = useMemo(() => {
    let result = allTxs;
    if (txFilter === 'card') result = result.filter(t => t.fromAddress === 'CARD_PAYMENT');
    else if (txFilter === 'booth') result = result.filter(t => t.toAddress.startsWith('0xBooth'));
    else if (txFilter === 'mining') result = result.filter(t => t.purpose === 'Mining Reward');
    else if (txFilter === 'system') result = result.filter(t => t.fromAddress === 'SYSTEM');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.fromAddress.toLowerCase().includes(q) ||
        t.toAddress.toLowerCase().includes(q) ||
        t.purpose.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allTxs, txFilter, searchQuery]);

  const filterBtn = (label: string, value: TxFilter) => (
    <button
      key={value}
      onClick={() => setTxFilter(value)}
      className={`neon-btn ${txFilter === value ? 'btn-primary' : 'btn-secondary'}`}
      style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px' }}
    >
      {label}
    </button>
  );

  return (
    <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        {[
          { icon: <Server size={28} color="var(--neon-blue)" />, label: '전체 블록 수', value: `${bc.chain.length}개` },
          { icon: <Cpu size={28} color="var(--neon-purple)" />, label: '멤풀 대기 TX', value: `${bc.pendingTransactions.length} 건` },
          { icon: <Coins size={28} color="var(--neon-yellow)" />, label: '채굴 보상액', value: `${miningReward} 코인` },
          { icon: isChainHealthy ? <CheckCircle size={28} color="var(--neon-emerald)" /> : <ShieldAlert size={28} color="#ef4444" className="animate-pulse" />, label: '체인 상태', value: isChainHealthy ? '정상' : '위조 감지' },
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            {stat.icon}
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{stat.label}</span>
              <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {bc.pendingTransactions.length > 0 && (
        <div className="glass-card pulse-blue" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RefreshCw className="animate-spin" size={16} color="var(--neon-blue)" />
            <div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{bc.pendingTransactions.length}건 대기 트랜잭션</span>
              <p style={{ fontSize: '11px', color: '#64748b' }}>새 블록을 채굴하면 변조없는 원장에 확정됩니다.</p>
            </div>
          </div>
          <button onClick={runMiningProcess} disabled={isMining} className="neon-btn btn-primary" style={{ minWidth: '130px' }}>
            {isMining ? <><Cpu className="animate-pulse" size={13} /> 채굴 중 ({miningProgress}%)</> : <><Play size={13} /> 블록 채굴</>}
          </button>
        </div>
      )}

      <div>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Server size={16} color="var(--neon-blue)" /> 블록체인 블록 시각화
        </h3>
        <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', padding: '8px 4px 16px', alignItems: 'stretch' }}>
          {bc.chain.map((block, index) => {
            const isBlockValid = block.hash === block.calculateHash();
            const isLinkValid = index === 0 || block.previousHash === bc.chain[index - 1].hash;
            const valid = isBlockValid && isLinkValid;
            return (
              <div key={block.index} style={{ display: 'flex', alignItems: 'center' }}>
                {index > 0 && (
                  <div style={{ width: '36px', height: '2px', background: isLinkValid ? 'linear-gradient(90deg, #10b981, #3b82f6)' : '#ef4444', position: 'relative', flexShrink: 0 }}>
                    {!isLinkValid && <AlertTriangle size={12} color="#ef4444" style={{ position: 'absolute', top: '-14px', left: '10px' }} />}
                  </div>
                )}
                <div
                  onClick={() => setSelectedBlockIndex(block.index === selectedBlockIndex ? null : block.index)}
                  className="glass-card"
                  style={{
                    width: '240px', padding: '14px', cursor: 'pointer', flexShrink: 0,
                    border: block.index === selectedBlockIndex ? '1px solid var(--neon-blue)' : valid ? '1px solid rgba(255,255,255,0.06)' : '2px solid #ef4444',
                    boxShadow: valid ? '0 4px 15px rgba(0,0,0,0.2)' : '0 0 20px rgba(239,68,68,0.2)',
                    background: valid ? 'var(--bg-panel)' : 'rgba(239,68,68,0.04)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#4f46e5' }}>BLOCK #{block.index}</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{new Date(block.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b', fontWeight: '600' }}>블록 해시:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#0f172a', fontWeight: '700' }}>{block.hash.substring(0, 14)}...</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b', fontWeight: '600' }}>이전 해시:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#475569' }}>{block.previousHash ? `${block.previousHash.substring(0, 14)}...` : 'GENESIS'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>TX 건수:</span>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>{block.transactions.length} 건</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Nonce:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#0f172a' }}>{block.nonce}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                    <span style={{ fontSize: '10px', color: valid ? '#059669' : '#dc2626', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {valid ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                      {valid ? '검증 성공' : '해시 위조!'}
                    </span>
                    {!valid && (
                      <button onClick={e => { e.stopPropagation(); reMineChainFrom(block.index); }} className="neon-btn btn-primary" style={{ padding: '2px 7px', fontSize: '10px', borderRadius: '4px' }}>
                        재채굴
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 선택한 블록의 해시 상세 정보 표시 패널 */}
        {selectedBlockIndex !== null && bc.chain[selectedBlockIndex] && (() => {
          const sBlock = bc.chain[selectedBlockIndex];
          const isBlockValid = sBlock.hash === sBlock.calculateHash();
          const isLinkValid = selectedBlockIndex === 0 || sBlock.previousHash === bc.chain[selectedBlockIndex - 1].hash;
          const valid = isBlockValid && isLinkValid;
          return (
            <div className="glass-card" style={{ padding: '18px 22px', marginTop: '12px', background: valid ? '#f8fafc' : '#fef2f2', border: `1px solid ${valid ? '#cbd5e1' : '#fca5a5'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔍 블록 #{sBlock.index} SHA-256 암호화 해시 검증 상세
                </h4>
                <button onClick={() => setSelectedBlockIndex(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>
                  ✕ 닫기
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '12px' }}>
                <div style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>현재 블록 해시 (Current Block Hash - 256bit SHA-256):</span>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: valid ? '#4f46e5' : '#dc2626', fontWeight: '700', wordBreak: 'break-all' }}>
                    {sBlock.hash}
                  </code>
                </div>

                <div style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>이전 블록 해시 (Previous Block Hash Link):</span>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: isLinkValid ? '#059669' : '#dc2626', fontWeight: '700', wordBreak: 'break-all' }}>
                    {sBlock.previousHash || '0000000000000000000000000000000000000000000000000000000000000000 (GENESIS)'}
                  </code>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>작업증명 Nonce: </span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#0f172a' }}>{sBlock.nonce}</strong>
                  </div>
                  <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>생성 시각: </span>
                    <strong style={{ color: '#0f172a' }}>{new Date(sBlock.timestamp).toLocaleString()}</strong>
                  </div>
                  <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>트랜잭션 수: </span>
                    <strong style={{ color: '#0f172a' }}>{sBlock.transactions.length} 건</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={15} color="var(--neon-purple)" /> 트랜잭션 검색 및 필터
          </h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {filterBtn('전체', 'all')}
            {filterBtn('카드 충전', 'card')}
            {filterBtn('부스 결제', 'booth')}
            {filterBtn('채굴 보상', 'mining')}
            {filterBtn('시스템', 'system')}
          </div>
        </div>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="주소, TX ID, 목적 검색..."
            className="neon-input" style={{ paddingLeft: '34px' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
          표시: {filteredTxs.length}건 (전체 {allTxs.length}건)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
          {filteredTxs.slice(0, 50).map(tx => {
            const isSystem = tx.fromAddress === 'SYSTEM';
            const isCard = tx.fromAddress === 'CARD_PAYMENT';
            const isMiningReward = tx.purpose === 'Mining Reward';
            const originalAmt = originalTransactions[tx.id];
            const isTampered = originalAmt !== undefined && tx.amount !== originalAmt;
            const leftColor = isTampered ? '#ef4444' : isSystem ? '#3b82f6' : isCard ? '#f59e0b' : isMiningReward ? '#8b5cf6' : '#10b981';

            return (
              <div key={`${tx.id}-${tx.blockIndex}`} className="glass-card" style={{
                padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
                borderLeft: `3px solid ${leftColor}`,
                background: isTampered ? 'rgba(239,68,68,0.04)' : 'var(--bg-panel)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span
                      onClick={() => setDetailedBlockIndex(tx.blockIndex)}
                      style={{
                        color: 'var(--neon-blue)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontWeight: '700',
                        marginRight: '6px'
                      }}
                      title="클릭하여 블록 상세 정보 보기"
                    >
                      Block #{tx.blockIndex}
                    </span>
                    | TX: {tx.id.substring(0, 20)}...
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '3px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#64748b' }}>송신: <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{tx.fromAddress.substring(0, 14)}...</strong></span>
                    <span style={{ color: '#64748b' }}>수신: <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{tx.toAddress.substring(0, 14)}...</strong></span>
                    <span style={{ color: '#4338ca', fontWeight: '600' }}>{tx.purpose}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: isTampered ? '#ef4444' : '#0f172a' }}>{tx.amount} 코인</span>
                    {isTampered && <span style={{ display: 'block', fontSize: '10px', color: '#9ca3af', textDecoration: 'line-through' }}>원래: {originalAmt}</span>}
                  </div>
                  {!isSystem && selectedBlockIndex === tx.blockIndex && (
                    isTampered
                      ? <button onClick={() => restoreTransaction(tx.blockIndex, tx.id)} className="neon-btn btn-secondary" style={{ padding: '4px 10px', fontSize: '10px' }}>원상복원</button>
                      : <button onClick={() => handleTamper(tx.blockIndex, tx.id, tx.amount)} className="neon-btn btn-danger" style={{ padding: '4px 10px', fontSize: '10px' }}>위조테스트</button>
                  )}
                </div>
              </div>
            );
          })}
          {filteredTxs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px' }}>
              검색에 일치하는 트랜잭션이 없습니다.
            </div>
          )}
        </div>
        {selectedBlockIndex !== null && (
          <p style={{ fontSize: '11px', color: '#4338ca', marginTop: '8px' }}>
            * 블록 #{selectedBlockIndex} 선택됨 - 이 블록의 트랜잭션에서 위조/복원 버튼이 활성화됩니다.
          </p>
        )}
      </div>

      {/* 위조 입력 모달 */}
      {tamperingBlockIndex !== null && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '360px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #ef4444' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle color="#ef4444" size={18} /> 트랜잭션 위조 테스트
            </h3>
            <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
              원장의 트랜잭션 금액을 위조합니다. 이 작업은 블록체인의 암호화 해시 무결성을 즉시 깨뜨립니다.
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>위조할 금액 ({coinName})</label>
              <input type="number" value={tamperedAmount} onChange={e => setTamperedAmount(parseInt(e.target.value) || 0)} className="neon-input" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={() => setTamperingBlockIndex(null)} className="neon-btn btn-secondary">취소</button>
              <button onClick={executeTampering} className="neon-btn btn-danger" style={{ backgroundColor: '#dc2626', color: 'white' }}>위조 실행</button>
            </div>
          </div>
        </div>
      )}

      {/* 블록 상세 정보 팝업 모달 */}
      {detailedBlockIndex !== null && bc.chain[detailedBlockIndex] && (() => {
        const sBlock = bc.chain[detailedBlockIndex];
        const isBlockValid = sBlock.hash === sBlock.calculateHash();
        const isLinkValid = detailedBlockIndex === 0 || sBlock.previousHash === bc.chain[detailedBlockIndex - 1].hash;
        const valid = isBlockValid && isLinkValid;
        return (
          <div style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
          }}>
            <div className="glass-card" style={{
              width: '600px', maxWidth: '100%',
              maxHeight: '85vh', overflowY: 'auto',
              padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px',
              border: `1px solid ${valid ? '#cbd5e1' : '#fca5a5'}`,
              background: '#ffffff',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              {/* 헤더 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={20} color="var(--neon-blue)" /> 블록 상세 정보 (Block #{sBlock.index})
                </h3>
                <button
                  onClick={() => setDetailedBlockIndex(null)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#64748b', fontSize: '20px', display: 'flex', alignItems: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* 블록 메타데이터 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>블록 해시 (Current Hash):</span>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: valid ? '#4f46e5' : '#dc2626', fontWeight: '700', wordBreak: 'break-all' }}>
                    {sBlock.hash}
                  </code>
                </div>

                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '4px' }}>이전 블록 해시 (Previous Hash):</span>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: isLinkValid ? '#059669' : '#dc2626', fontWeight: '700', wordBreak: 'break-all' }}>
                    {sBlock.previousHash || '0000000000000000000000000000000000000000000000000000000000000000 (GENESIS)'}
                  </code>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>작업증명 Nonce</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#0f172a', fontSize: '13px' }}>{sBlock.nonce}</strong>
                  </div>
                  <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>생성 시각</span>
                    <strong style={{ color: '#0f172a', fontSize: '13px' }}>{new Date(sBlock.timestamp).toLocaleString()}</strong>
                  </div>
                  <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>검증 상태</span>
                    <strong style={{ color: valid ? '#059669' : '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {valid ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      {valid ? '검증 성공' : '해시 위조됨'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 블록 내 포함된 트랜잭션 목록 */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                  📦 포함된 트랜잭션 ({sBlock.transactions.length}건)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {sBlock.transactions.map((t, idx) => {
                    const originalAmt = originalTransactions[t.id];
                    const isTampered = originalAmt !== undefined && t.amount !== originalAmt;
                    return (
                      <div key={t.id} style={{
                        padding: '10px', background: isTampered ? '#fef2f2' : '#f8fafc',
                        border: `1px solid ${isTampered ? '#fca5a5' : '#e2e8f0'}`,
                        borderRadius: '8px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b' }}>
                            TX #{idx + 1}: {t.id.substring(0, 16)}...
                          </div>
                          <div style={{ marginTop: '2px', color: '#334155' }}>
                            {t.fromAddress === 'CARD_PAYMENT' ? '💳 신용카드 충전' : t.fromAddress === 'SYSTEM' ? '⚙️ 시스템 발행' : `👤 ${t.fromAddress.substring(0, 10)}...`} ➔ {t.toAddress.startsWith('0xBooth') ? '🎪 부스' : `👤 ${t.toAddress.substring(0, 10)}...`}
                          </div>
                          <div style={{ fontSize: '10px', color: '#4338ca', fontWeight: '600', marginTop: '1px' }}>
                            {t.purpose}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '14px', color: isTampered ? '#dc2626' : '#0f172a' }}>{t.amount} 코인</strong>
                          {isTampered && <span style={{ display: 'block', fontSize: '9px', color: '#9ca3af', textDecoration: 'line-through' }}>원래: {originalAmt}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 하단 제어 버튼 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                {!valid && (
                  <button
                    onClick={() => {
                      reMineChainFrom(sBlock.index);
                      setDetailedBlockIndex(null);
                    }}
                    className="neon-btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                  >
                    <RefreshCw size={13} /> 이 블록부터 재채굴
                  </button>
                )}
                <button
                  onClick={() => setDetailedBlockIndex(null)}
                  className="neon-btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

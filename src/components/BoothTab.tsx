import React, { useMemo, useState, useEffect } from 'react';
import { QrCode, RefreshCw, Play, CheckCircle } from 'lucide-react';
import { Blockchain, Transaction } from '../blockchain';
import type { Booth, ReceiptData, VisitorWallet } from '../types';
import { VisualQRCode } from './VisualQRCode';
import type { ToastType } from '../hooks/useToast';

interface BoothTabProps {
  blockchainRef: React.MutableRefObject<Blockchain>;
  blockchainTick: number;
  updateBlockchainState: () => void;
  isCoinExpired: boolean;
  isMining: boolean;
  autoMine: boolean;
  booths: Booth[];
  activeBoothId: string;
  setActiveBoothId: (id: string) => void;
  processedTxIds: Record<string, boolean>;
  setProcessedTxIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  runMiningProcess: (onSuccess?: () => void) => Promise<void>;
  onShowReceipt: (data: ReceiptData) => void;
  addToast: (type: ToastType, title: string, message?: string) => void;
  visitors: VisitorWallet[];
  activeVisitorIndex: number;
  loggedInVisitor?: VisitorWallet;
  isAdmin?: boolean;
}

export function BoothTab({
  blockchainRef, blockchainTick: _tick, updateBlockchainState,
  isCoinExpired, isMining: _isMining, autoMine, booths, activeBoothId, setActiveBoothId,
  processedTxIds, setProcessedTxIds, runMiningProcess, onShowReceipt, addToast,
  visitors, activeVisitorIndex, loggedInVisitor, isAdmin = false,
}: BoothTabProps) {
  const bc = blockchainRef.current;
  const coinName = bc.coinName;

  // 현재 로그인/선택된 관람객 지갑 구하기
  const effectiveVisitorIndex = loggedInVisitor
    ? visitors.findIndex(v => v.loginId === loggedInVisitor.loginId)
    : activeVisitorIndex;
  const currentVisitor = effectiveVisitorIndex >= 0 ? visitors[effectiveVisitorIndex] : undefined;

  const currentVisitorBalance = useMemo(
    () => currentVisitor ? bc.getBalanceOfAddress(currentVisitor.address) : 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_tick, currentVisitor?.address]
  );

  const activeBooth = useMemo(() => booths.find(b => b.id === activeBoothId) || booths[0], [booths, activeBoothId]);

  const getBoothStats = (boothId: string) => {
    let visits = 0, revenue = 0;
    bc.chain.forEach(block => {
      block.transactions.forEach(tx => {
        if (tx.toAddress === boothId && tx.fromAddress !== 'SYSTEM') { visits++; revenue += tx.amount; }
      });
    });
    return { visits, revenue };
  };

  const [boothSelectedAt, setBoothSelectedAt] = useState<number>(Date.now());

  useEffect(() => {
    setBoothSelectedAt(Date.now());
  }, [activeBoothId]);

  const activeBoothStatus = useMemo(() => {
    const pendingTx = bc.pendingTransactions.find(
      tx => tx.toAddress === activeBoothId && tx.amount === activeBooth.cost && tx.timestamp >= boothSelectedAt
    );
    if (pendingTx) return { status: 'pending' as const, payer: pendingTx.fromAddress, txId: pendingTx.id };

    for (let i = bc.chain.length - 1; i >= 1; i--) {
      const block = bc.chain[i];
      const confirmed = block.transactions.find(
        tx => tx.toAddress === activeBoothId && tx.amount === activeBooth.cost
          && tx.timestamp >= boothSelectedAt && tx.fromAddress.startsWith('0xVisitor')
      );
      if (confirmed) return { status: 'success' as const, payer: confirmed.fromAddress, txId: confirmed.id, blockIndex: i };
    }
    return { status: 'idle' as const, payer: '', txId: '', blockIndex: 0 };
  }, [_tick, activeBoothId, activeBooth.cost, boothSelectedAt]);

  // 부스 선택 및 자동 코인 결제 수행
  const handleSelectAndPayBooth = (booth: Booth) => {
    setActiveBoothId(booth.id);

    if (isCoinExpired) {
      addToast('error', '만료된 코인', '코인의 유효기간이 만료되었습니다.');
      return;
    }

    if (!currentVisitor) {
      addToast('error', '결제 오류', '로그인된 관람객 지갑이 없습니다.');
      return;
    }

    if (currentVisitorBalance < booth.cost) {
      addToast('warning', '잔액 부족!', `${currentVisitor.name} 님의 잔액이 부족합니다. (필요: ${booth.cost}코인, 보유: ${currentVisitorBalance}코인). 지갑 탭에서 카드로 충전해 주세요.`);
      return;
    }

    // 자동 결제 트랜잭션 생성 및 서명
    const tx = new Transaction(currentVisitor.address, booth.id, booth.cost, `부스 자동 결제: ${booth.name}`);
    try {
      tx.signTransaction(currentVisitor.privateKey);
      bc.addTransaction(tx);
      updateBlockchainState();
      addToast('success', `⚡ 자동 결제 성공!`, `${currentVisitor.name} 님 → ${booth.name} (${booth.cost} 코인 차감)`);

      if (autoMine) {
        runMiningProcess(() => {
          const latestBlock = bc.chain[bc.chain.length - 1];
          const found = latestBlock?.transactions.find(t => t.id === tx.id);
          if (found) {
            onShowReceipt({
              txId: found.id, fromAddress: found.fromAddress, toAddress: found.toAddress,
              amount: found.amount, purpose: found.purpose,
              blockIndex: latestBlock.index, timestamp: latestBlock.timestamp, coinName,
            });
          }
        });
      }
    } catch (err: unknown) {
      addToast('error', '결제 오류', err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
    }
  };

  const resetBoothPayment = () => {
    if (activeBoothStatus.txId) {
      setProcessedTxIds(prev => ({ ...prev, [activeBoothStatus.txId]: true }));
    }
  };

  return (
    <div className="tab-content" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>

      {/* 왼쪽: 체험 부스 목록 */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={18} color="var(--neon-emerald)" /> 체험 부스 목록
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
            부스를 선택하면 ⚡ <strong>내 지갑에서 즉시 자동 결제</strong>됩니다.
          </p>
        </div>

        {/* 현재 접속 관람객 정보 요약 */}
        {currentVisitor ? (
          <div style={{ padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', fontSize: '12px', color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>👤 <strong>{currentVisitor.name}</strong> 님 지갑</span>
            <span style={{ fontWeight: '800', color: '#059669' }}>{currentVisitorBalance} 코인</span>
          </div>
        ) : (
          <div style={{ padding: '10px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', fontSize: '12px', color: '#c2410c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ <strong>지갑 선택 안됨</strong></span>
            <span style={{ fontSize: '11px', color: '#9a3412', fontWeight: '700' }}>지갑 탭에서 선택 필요</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '480px' }}>
          {booths.map(b => {
            const active = b.id === activeBoothId;
            const stats = getBoothStats(b.id);
            return (
              <div
                key={b.id}
                onClick={() => setActiveBoothId(b.id)}
                className="glass-card"
                style={{
                  padding: '14px', cursor: 'pointer',
                  border: active ? '2px solid #0d9488' : '1px solid #e2e8f0',
                  background: active ? '#f0fdf4' : '#ffffff',
                  transition: 'all 0.2s ease',
                  borderRadius: '12px',
                  boxShadow: active ? '0 4px 12px rgba(13,148,136,0.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{b.name}</span>
                  <span style={{ fontSize: '13px', color: '#0d9488', fontWeight: '800', background: '#ccfbf1', padding: '2px 8px', borderRadius: '12px' }}>
                    {b.cost} 코인
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.description}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '11px' }}>
                  <div style={{ display: 'flex', gap: '10px', color: '#94a3b8' }}>
                    <span>방문: <strong style={{ color: '#0f172a' }}>{stats.visits}명</strong></span>
                    {isAdmin && (
                      <span>수익: <strong style={{ color: '#0d9488' }}>{stats.revenue} 코인</strong></span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSelectAndPayBooth(b); }}
                    className="neon-btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', backgroundColor: '#0d9488' }}
                  >
                    ⚡ 즉시 결제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 오른쪽: 활성 부스 결제 상태 및 QR 시각화 */}
      <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '22px', background: '#ffffff' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{activeBooth.name}</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', maxWidth: '460px' }}>{activeBooth.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(13,148,136,0.12)', color: '#0d9488', fontWeight: '800', padding: '6px 18px', borderRadius: '20px', fontSize: '15px', border: '1px solid rgba(13,148,136,0.3)' }}>
              체험료: {activeBooth.cost} {coinName}
            </div>
            <button
              onClick={() => handleSelectAndPayBooth(activeBooth)}
              className="neon-btn btn-primary"
              style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '20px', backgroundColor: '#0d9488' }}
            >
              ⚡ 자동 결제 진행
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <VisualQRCode value={`${activeBooth.id}:${activeBooth.cost}`} size={180} />
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            부스 ID: {activeBooth.id}
          </span>
        </div>

        <div className="glass-card" style={{
          width: '100%', maxWidth: '440px', padding: '20px', textAlign: 'center',
          border: activeBoothStatus.status === 'success' ? '1px solid #6ee7b7'
                : activeBoothStatus.status === 'pending' ? '1px solid #93c5fd'
                : '1px solid #cbd5e1',
          background: activeBoothStatus.status === 'success' ? '#ecfdf5'
                    : activeBoothStatus.status === 'pending' ? '#eff6ff'
                    : '#f8fafc',
          borderRadius: '16px',
        }}>
          {activeBoothStatus.status === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6b7280' }} />
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>왼쪽 부스 목록을 클릭하면 자동 결제됩니다.</span>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>부스 선택 시 ⚡ 즉시 서명 및 코인 차감이 실행됩니다.</p>
            </div>
          )}
          {activeBoothStatus.status === 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <RefreshCw className="animate-spin" size={20} color="#4f46e5" />
              <span style={{ fontSize: '15px', color: '#4338ca', fontWeight: '700' }}>결제 블록 승인 처리 중...</span>
              <p style={{ fontSize: '11px', color: '#64748b' }}>TX: {activeBoothStatus.txId.substring(0, 16)}...</p>
              <button onClick={() => runMiningProcess()} className="neon-btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px', backgroundColor: '#4f46e5' }}>
                <Play size={11} /> 블록 즉시 채굴
              </button>
            </div>
          )}
          {activeBoothStatus.status === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={32} color="#059669" />
              <span style={{ fontSize: '18px', color: '#047857', fontWeight: '800' }}>✅ 결제 완료! 체험 입장 가능</span>
              <p style={{ fontSize: '12px', color: '#475569' }}>
                수신: <strong>{activeBooth.cost} {coinName}</strong> | 결제자: {activeBoothStatus.payer.substring(0, 14)}...
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={() => {
                    const block = bc.chain[activeBoothStatus.blockIndex];
                    if (block) {
                      onShowReceipt({
                        txId: activeBoothStatus.txId, fromAddress: activeBoothStatus.payer,
                        toAddress: activeBooth.id, amount: activeBooth.cost, purpose: `부스 결제: ${activeBooth.name}`,
                        blockIndex: activeBoothStatus.blockIndex, timestamp: block.timestamp, coinName,
                      });
                    }
                  }}
                  className="neon-btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px', backgroundColor: '#0d9488' }}
                >
                  <Play size={11} /> 영수증 보기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


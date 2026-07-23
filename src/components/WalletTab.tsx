import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet, CreditCard, ArrowRight, Lock, Unlock, Copy, Check,
  Zap, Plus, Users, History, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2
} from 'lucide-react';
import { Blockchain, Transaction } from '../blockchain';
import type { Booth, VisitorWallet, ReceiptData } from '../types';
import type { ToastType } from '../hooks/useToast';

const formatPurpose = (purpose: string, fromAddress: string, toAddress: string, currentAddress: string) => {
  if (fromAddress.startsWith('0xVisitor') && toAddress.startsWith('0xVisitor')) {
    const isIncoming = toAddress === currentAddress;
    return isIncoming ? purpose.replace('송금', '입금') : purpose.replace('입금', '송금');
  }
  return purpose;
};

interface WalletTabProps {
  blockchainRef: React.MutableRefObject<Blockchain>;
  blockchainTick: number;
  updateBlockchainState: () => void;
  isCoinExpired: boolean;
  autoMine: boolean;
  booths: Booth[];
  activeBoothId: string;
  visitors: VisitorWallet[];
  activeVisitorIndex: number;
  setActiveVisitorIndex: (i: number) => void;
  onAddVisitor: (name: string, loginId?: string, password?: string) => { ok: boolean; error?: string };
  onUpdateVisitor: (index: number, name: string, loginId: string, password: string) => { ok: boolean; error?: string };
  onShowCardModal: () => void;
  onShowReceipt: (data: ReceiptData) => void;
  addToast: (type: ToastType, title: string, message?: string) => void;
  runMiningProcess: (onSuccess?: () => void) => Promise<void>;
  /** 로그인된 관람객 (visitor mode) - 없으면 admin이 전체 지갑 목록 표시 */
  loggedInVisitor?: VisitorWallet;
}

export function WalletTab({
  blockchainRef, blockchainTick: _tick, updateBlockchainState,
  isCoinExpired, autoMine, booths,
  visitors, activeVisitorIndex, setActiveVisitorIndex, onAddVisitor, onUpdateVisitor,
  onShowCardModal, onShowReceipt, addToast, runMiningProcess,
  loggedInVisitor,
}: WalletTabProps) {
  const bc = blockchainRef.current;
  const coinName = bc.coinName;
  const expiryDate = bc.expiryDate;

  // visitor mode: loggedInVisitor의 인덱스를 찾아 activeVisitorIndex 고정
  const effectiveVisitorIndex = loggedInVisitor
    ? visitors.findIndex(v => v.loginId === loggedInVisitor.loginId)
    : activeVisitorIndex;
  const effectiveActiveIndex = effectiveVisitorIndex >= 0 ? effectiveVisitorIndex : activeVisitorIndex;

  const [showPrivKey, setShowPrivKey] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState(10);
  const [sendPurpose, setSendPurpose] = useState('부스 체험');
  const [enteredKey, setEnteredKey] = useState('');
  const [newVisitorName, setNewVisitorName] = useState('');
  const [newVisitorId, setNewVisitorId] = useState('');
  const [newVisitorPw, setNewVisitorPw] = useState('');
  const [showAddVisitor, setShowAddVisitor] = useState(false);

  // 수정용 state
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editName, setEditName] = useState('');
  const [editId, setEditId] = useState('');
  const [editPw, setEditPw] = useState('');

  // effectiveActiveIndex가 -1인 경우 (미선택) visitor는 undefined
  const visitor = effectiveActiveIndex >= 0 ? visitors[effectiveActiveIndex] : undefined;

  // visitor 변경 시 비밀키 입력란에 자동 세팅 (테스트 및 사용자 편의성)
  useEffect(() => {
    if (visitor) {
      setEnteredKey(visitor.privateKey);
    } else {
      setEnteredKey('');
    }
  }, [visitor]);

  const balance = useMemo(
    () => visitor ? bc.getBalanceOfAddress(visitor.address) : 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_tick, visitor?.address]
  );

  const allBalances = useMemo(
    () => visitors.map(v => ({ ...v, balance: bc.getBalanceOfAddress(v.address) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_tick, visitors]
  );

  // 거래 내역 추출
  const history = useMemo(() => {
    return visitor ? bc.getTransactionHistory(visitor.address) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_tick, visitor?.address]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleStartEdit = (index: number, v: VisitorWallet) => {
    setEditingIndex(index);
    setEditName(v.name);
    setEditId(v.loginId);
    setEditPw(v.password);
  };

  const handleSaveEdit = (index: number) => {
    const res = onUpdateVisitor(index, editName, editId, editPw);
    if (res && res.ok) {
      setEditingIndex(-1);
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitor) return;
    if (isCoinExpired) { addToast('error', '만료된 토큰', '코인의 유효기간이 지나 송금할 수 없습니다.'); return; }
    if (enteredKey !== visitor.privateKey) { addToast('error', '서명 검증 실패', '입력한 비밀키가 일치하지 않습니다.'); return; }
    const tx = new Transaction(visitor.address, sendTo, sendAmount, sendPurpose);
    try {
      tx.signTransaction(visitor.privateKey);
      bc.addTransaction(tx);
      setSendTo('');
      updateBlockchainState();
      addToast('info', '트랜잭션 전송 완료', '멤풀(Mempool) 대기열에 포함되었습니다.');
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
      addToast('error', '송금 오류', err instanceof Error ? err.message : '알 수 없는 오류');
    }
  };

  const handleOneClick = (booth: Booth) => {
    if (!visitor) return;
    if (isCoinExpired) { addToast('error', '만료된 토큰', '코인 유효기간이 지났습니다.'); return; }
    if (balance < booth.cost) { addToast('warning', '잔액 부족', '가상 카드 결제로 코인을 충전해주세요!'); return; }
    const tx = new Transaction(visitor.address, booth.id, booth.cost, `부스 체험 결제: ${booth.name}`);
    try {
      tx.signTransaction(visitor.privateKey);
      bc.addTransaction(tx);
      updateBlockchainState();
      addToast('success', `⚡ 결제 성공!`, `${booth.name} (${booth.cost} 코인 차감)`);
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
      addToast('error', '결제 오류', err instanceof Error ? err.message : '알 수 없는 오류');
    }
  };

  // 주소를 관람객/부스 이름으로 매핑
  const resolveAddressName = (addr: string) => {
    if (addr === 'CARD_PAYMENT') return '💳 신용카드 충전';
    if (addr === 'SYSTEM') return '⚙️ 시스템 발행';
    const foundV = visitors.find(v => v.address === addr);
    if (foundV) return `👤 ${foundV.name}`;
    const foundB = booths.find(b => b.id === addr);
    if (foundB) return `🎪 ${foundB.name}`;
    return addr.substring(0, 12) + '...';
  };

  // === ADMIN VIEW RENDER ===
  if (!loggedInVisitor) {
    return (
      <div className="tab-content" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: '20px' }}>
        
        {/* 왼쪽 컬럼: 등록된 모든 관람객 지갑 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} color="var(--neon-blue)" /> 등록된 모든 관람객 지갑 목록
              </h3>
              <button
                onClick={() => setShowAddVisitor(v => !v)}
                className="neon-btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '8px' }}
              >
                <Plus size={11} /> 지갑 추가
              </button>
            </div>

            {showAddVisitor && (
              <form 
                onSubmit={e => { 
                  e.preventDefault(); 
                  if (newVisitorName.trim() && visitors.length < 20) { 
                    const res = onAddVisitor(newVisitorName.trim(), newVisitorId.trim() || undefined, newVisitorPw.trim() || undefined); 
                    if (res && typeof res === 'object' && !res.ok) {
                      addToast('error', '지갑 생성 실패', res.error || '오류 발생');
                    } else {
                      setNewVisitorName(''); 
                      setNewVisitorId('');
                      setNewVisitorPw('');
                      setShowAddVisitor(false); 
                    }
                  } 
                }} 
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
              >
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text" value={newVisitorName} onChange={e => setNewVisitorName(e.target.value)}
                    placeholder="관람객 이름 (필수)" className="neon-input"
                    style={{ flex: '1 1 120px', padding: '6px 10px', fontSize: '12px' }}
                    required
                  />
                  <input
                    type="text" value={newVisitorId} onChange={e => setNewVisitorId(e.target.value)}
                    placeholder="로그인 아이디 (선택)" className="neon-input"
                    style={{ flex: '1 1 120px', padding: '6px 10px', fontSize: '12px' }}
                  />
                  <input
                    type="password" value={newVisitorPw} onChange={e => setNewVisitorPw(e.target.value)}
                    placeholder="비밀번호 (선택)" className="neon-input"
                    style={{ flex: '1 1 120px', padding: '6px 10px', fontSize: '12px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  <button type="button" className="neon-btn btn-secondary" onClick={() => setShowAddVisitor(false)} style={{ padding: '4px 12px', fontSize: '11px' }}>취소</button>
                  <button type="submit" className="neon-btn btn-primary" style={{ padding: '4px 12px', fontSize: '11px' }}>추가</button>
                </div>
              </form>
            )}

            {/* 테이블 형식의 지갑 목록 */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)', fontWeight: '600' }}>
                    <th style={{ padding: '8px' }}>이름</th>
                    <th style={{ padding: '8px' }}>지갑 주소</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>보유 잔액</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>인증 방식</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {allBalances.map((v, i) => {
                    const isSelected = i === effectiveActiveIndex;
                    const isEditing = i === editingIndex;

                    if (isEditing) {
                      return (
                        <tr key={v.address} style={{ borderBottom: '1px solid #cbd5e1', background: '#fef08a' }}>
                          <td style={{ padding: '8px', verticalAlign: 'middle' }} colSpan={2}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: '#475569', width: '50px', fontWeight: 'bold' }}>이름:</span>
                                <input 
                                  type="text" 
                                  value={editName} 
                                  onChange={e => setEditName(e.target.value)} 
                                  style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }} 
                                  className="neon-input"
                                  required
                                />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: '#475569', width: '50px', fontWeight: 'bold' }}>아이디:</span>
                                <input 
                                  type="text" 
                                  value={editId} 
                                  onChange={e => setEditId(e.target.value)} 
                                  style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }} 
                                  className="neon-input"
                                  required
                                />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: '#475569', width: '50px', fontWeight: 'bold' }}>비밀번호:</span>
                                <input 
                                  type="text" 
                                  value={editPw} 
                                  onChange={e => setEditPw(e.target.value)} 
                                  style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }} 
                                  className="neon-input"
                                  required
                                />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '8px', color: '#0d9488', fontWeight: '700', textAlign: 'right', verticalAlign: 'middle' }}>
                            {v.balance.toLocaleString()} 코인
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>
                            {v.rfidUid ? (
                              <span style={{ fontSize: '10px', background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '8px', fontWeight: '600' }}>RFID</span>
                            ) : (
                              <span style={{ fontSize: '10px', background: '#e0e7ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '8px', fontWeight: '600' }}>ID/PW</span>
                            )}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleSaveEdit(i); }} 
                                className="neon-btn btn-primary" 
                                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', width: '50px' }}
                              >
                                저장
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setEditingIndex(-1); }} 
                                className="neon-btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', width: '50px' }}
                              >
                                취소
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr 
                        key={v.address} 
                        onClick={() => setActiveVisitorIndex(i)}
                        style={{ 
                          borderBottom: '1px solid #f1f5f9', 
                          cursor: 'pointer',
                          background: isSelected ? '#f0fdf4' : 'transparent',
                          transition: 'all 0.2s ease',
                          fontWeight: isSelected ? '700' : 'normal'
                        }}
                      >
                        <td style={{ padding: '10px 8px', color: isSelected ? '#0d9488' : '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isSelected ? '#0d9488' : 'transparent' }} />
                          <div>
                            <div>{v.name}</div>
                            {v.loginId && (
                              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                ID: {v.loginId} / PW: {v.password}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {v.address}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#0d9488', fontWeight: '700', textAlign: 'right' }}>
                          {v.balance.toLocaleString()} 코인
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          {v.rfidUid ? (
                            <span style={{ fontSize: '10px', background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '8px', fontWeight: '600' }}>RFID</span>
                          ) : (
                            <span style={{ fontSize: '10px', background: '#e0e7ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '8px', fontWeight: '600' }}>ID/PW</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStartEdit(i, v); }} 
                            className="neon-btn btn-secondary" 
                            style={{ padding: '2px 8px', fontSize: '10px', borderRadius: '4px' }}
                          >
                            수정
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 오른쪽 컬럼: 선택된 지갑의 상세 정보 & 지갑 동작 제어 (송금, 결제, 내역) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {!visitor ? (
            <div className="glass-card" style={{
              padding: '48px 24px', textAlign: 'center', background: '#ffffff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
              border: '2px dashed #cbd5e1', minHeight: '400px', borderRadius: '16px'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#eff6ff',
                color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px'
              }}>
                <Users size={32} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>선택된 관람객 지갑 없음</h4>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '320px', lineHeight: '1.6' }}>
                👈 왼쪽 관람객 목록에서 상세 정보를 확인하고 직접 송금 및 부스 결제 권한을 대행할 지갑을 선택해 주세요.
              </p>
            </div>
          ) : (
            <>
              {/* 지갑 카드 및 동작 */}
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#ffffff' }}>
                <div style={{
                  backgroundColor: '#4338ca',
                  borderRadius: '16px', padding: '22px',
                  border: '1px solid #312e81',
                  boxShadow: '0 8px 24px rgba(67,56,202,0.15)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                    <div>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>선택된 관람객 지갑</span>
                      <h4 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginTop: '2px' }}>{visitor.name} 지갑</h4>
                    </div>
                    <Wallet size={34} color="rgba(255,255,255,0.3)" />
                  </div>
                  <div style={{ zIndex: 1, marginTop: '16px' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>보유 잔액 ({coinName})</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                      <span style={{ fontSize: '36px', fontWeight: '800', color: 'white' }}>{balance}</span>
                      <span style={{ fontSize: '16px', color: '#93c5fd', fontWeight: '600' }}>{coinName.substring(0, 7)}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>원화 환산 약 {(balance * 100).toLocaleString()} 원</span>
                      <span style={{ color: isCoinExpired ? '#fca5a5' : 'rgba(255,255,255,0.7)' }}>유효기간: {expiryDate}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '14px', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>
                        주소: {visitor.address}
                      </span>
                      <button onClick={() => copyToClipboard(visitor.address, 'address')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                        {copiedText === 'address' ? <Check size={11} color="#6ee7b7" /> : <Copy size={11} />}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>
                        비밀키: {showPrivKey ? visitor.privateKey : '....................'}
                      </span>
                      <button onClick={() => setShowPrivKey(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                        {showPrivKey ? <Lock size={11} /> : <Unlock size={11} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <button onClick={onShowCardModal} disabled={isCoinExpired} className="neon-btn btn-primary" style={{ padding: '13px', opacity: isCoinExpired ? 0.5 : 1 }}>
                    <CreditCard size={15} /> 💳 가상 카드 결제 충전
                  </button>
                </div>
              </div>

              {/* 💸 직접 송금하기 (Transfer Form) */}
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowRight size={18} color="var(--neon-purple)" /> {coinName} 코인 직접 송금하기 (관리자 권한)
                </h3>

                <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>수신자 주소</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="0xBooth_... 또는 0xVisitor_..." className="neon-input" required />
                      <select
                        onChange={e => {
                          const val = e.target.value;
                          const b = booths.find(x => x.id === val);
                          if (b) { setSendTo(b.id); setSendAmount(b.cost); setSendPurpose(`부스 결제: ${b.name}`); }
                          const v = visitors.find(x => x.address === val);
                          if (v) { setSendTo(v.address); setSendAmount(10); setSendPurpose(`P2P 송금 (${v.name})`); }
                        }}
                        className="neon-input" style={{ width: '160px', padding: '6px', fontSize: '12px' }}
                      >
                        <option value="">빠른 수신인 선택...</option>
                        <optgroup label="🎪 체험 부스">
                          {booths.map(b => <option key={b.id} value={b.id}>{b.name} ({b.cost}코인)</option>)}
                        </optgroup>
                        <optgroup label="👥 다른 관람객 (P2P)">
                          {visitors.filter(v => v.address !== visitor.address).map(v => <option key={v.address} value={v.address}>{v.name} 지갑</option>)}
                        </optgroup>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>송금 코인 수량</label>
                      <input type="number" value={sendAmount} onChange={e => setSendAmount(parseInt(e.target.value) || 0)} min="1" className="neon-input" required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>사용 목적 / 메모</label>
                      <input type="text" value={sendPurpose} onChange={e => setSendPurpose(e.target.value)} className="neon-input" required />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>비밀키 (자동 서명)</label>
                    <input type="password" value={enteredKey} onChange={e => setEnteredKey(e.target.value)} placeholder="pv_..." className="neon-input" required />
                    <span style={{ fontSize: '10px', color: '#4338ca', marginTop: '4px', display: 'block' }}>
                      선택된 관람객 비밀키: <code style={{ color: '#0f172a', fontWeight: '700' }}>{visitor.privateKey}</code>
                    </span>
                  </div>
                  <button type="submit" disabled={isCoinExpired} className="neon-btn btn-primary" style={{ width: '100%', padding: '13px', opacity: isCoinExpired ? 0.5 : 1 }}>
                    <Lock size={15} /> 🔒 트랜잭션 서명 및 송금 실행
                  </button>
                </form>
              </div>

              {/* ⚡ 원클릭 체험 부스 즉시 결제 */}
              <div className="glass-card" style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Zap size={13} color="#d97706" /> ⚡ 원클릭 체험 부스 즉시 결제
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {booths.map(b => (
                    <button
                      key={b.id}
                      onClick={() => handleOneClick(b)}
                      disabled={isCoinExpired}
                      className="neon-btn btn-secondary"
                      style={{ padding: '6px 11px', borderRadius: '8px', fontSize: '11px', opacity: isCoinExpired ? 0.5 : 1 }}
                    >
                      {b.name} ({b.cost} 코인)
                    </button>
                  ))}
                </div>
              </div>

              {/* 선택된 지갑의 거래 내역 */}
              <div className="glass-card" style={{ padding: '24px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <History size={15} color="#4f46e5" /> 📜 선택된 지갑 거래 내역 (실시간 확정/대기)
                </h4>

                {history.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #e2e8f0' }}>
                    아직 거래 내역이 없습니다.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '2px' }}>
                    {history.map((tx) => {
                      const isIncoming = tx.toAddress === visitor.address;
                      const isPending = bc.pendingTransactions.some(pt => pt.id === tx.id);
                      return (
                        <div
                          key={tx.id}
                          style={{
                            padding: '10px 12px',
                            background: isPending ? '#fefce8' : '#ffffff',
                            border: `1px solid ${isPending ? '#fef08a' : '#e2e8f0'}`,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: isIncoming ? '#ecfdf5' : '#fef2f2',
                              color: isIncoming ? '#059669' : '#dc2626',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {isIncoming ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {formatPurpose(tx.purpose, tx.fromAddress, tx.toAddress, visitor.address)}
                                {isPending ? (
                                  <span style={{ fontSize: '10px', color: '#d97706', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                    <Clock size={10} /> 대기 중
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '10px', color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                    <CheckCircle2 size={10} /> 확정
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                {isIncoming ? `상대방: ${resolveAddressName(tx.fromAddress)}` : `수신자: ${resolveAddressName(tx.toAddress)}`}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '800', fontSize: '14px', color: isIncoming ? '#059669' : '#dc2626' }}>
                              {isIncoming ? `+${tx.amount}` : `-${tx.amount}`} {coinName.substring(0, 5)}
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                              {new Date(tx.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    );
  }

  // === VISITOR VIEW: 일반 관람객 지갑 ===
  return (
    <div className="tab-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>

      {/* 왼쪽 컬럼: 지갑 정보 & 카드 결제 & 빠른 버튼 */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#ffffff' }}>
        
        {isCoinExpired && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#991b1b' }}>
            경고: 코인 유효기간 만료됨 ({expiryDate}). 어드민 탭에서 토큰을 재발행하세요.
          </div>
        )}

        {visitor && (
          <>
            <div style={{
              backgroundColor: '#4338ca',
              borderRadius: '16px', padding: '22px',
              border: '1px solid #312e81',
              boxShadow: '0 8px 24px rgba(67,56,202,0.15)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>관람객 가상 지갑</span>
                  <h4 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginTop: '2px' }}>{visitor.name} 지갑</h4>
                </div>
                <Wallet size={34} color="rgba(255,255,255,0.3)" />
              </div>
              <div style={{ zIndex: 1, marginTop: '16px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>보유 잔액 ({coinName})</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '36px', fontWeight: '800', color: 'white' }}>{balance}</span>
                  <span style={{ fontSize: '16px', color: '#93c5fd', fontWeight: '600' }}>{coinName.substring(0, 7)}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>원화 환산 약 {(balance * 100).toLocaleString()} 원</span>
                  <span style={{ color: isCoinExpired ? '#fca5a5' : 'rgba(255,255,255,0.7)' }}>유효기간: {expiryDate}</span>
                </div>
              </div>
              <div style={{ marginTop: '14px', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>
                    주소: {visitor.address}
                  </span>
                  <button onClick={() => copyToClipboard(visitor.address, 'address')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                    {copiedText === 'address' ? <Check size={11} color="#6ee7b7" /> : <Copy size={11} />}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>
                    비밀키: {showPrivKey ? visitor.privateKey : '....................'}
                  </span>
                  <button onClick={() => setShowPrivKey(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                    {showPrivKey ? <Lock size={11} /> : <Unlock size={11} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <button onClick={onShowCardModal} disabled={isCoinExpired} className="neon-btn btn-primary" style={{ padding: '13px', opacity: isCoinExpired ? 0.5 : 1 }}>
                <CreditCard size={15} /> 💳 가상 카드 결제 충전
              </button>
            </div>
          </>
        )}

        {/* 📜 내 지갑 거래 내역 (Transaction History) */}
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <History size={15} color="#4f46e5" /> 📜 내 거래 내역 (실시간 확정/대기)
          </h4>

          {history.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #e2e8f0' }}>
              아직 거래 내역이 없습니다. 카드 충전이나 송금을 시도해보세요!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '2px' }}>
              {history.map((tx) => {
                const isIncoming = visitor && tx.toAddress === visitor.address;
                const isPending = bc.pendingTransactions.some(pt => pt.id === tx.id);
                return (
                  <div
                    key={tx.id}
                    style={{
                      padding: '10px 12px',
                      background: isPending ? '#fefce8' : '#ffffff',
                      border: `1px solid ${isPending ? '#fef08a' : '#e2e8f0'}`,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: isIncoming ? '#ecfdf5' : '#fef2f2',
                        color: isIncoming ? '#059669' : '#dc2626',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isIncoming ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {visitor ? formatPurpose(tx.purpose, tx.fromAddress, tx.toAddress, visitor.address) : tx.purpose}
                          {isPending ? (
                            <span style={{ fontSize: '10px', color: '#d97706', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <Clock size={10} /> 대기 중
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <CheckCircle2 size={10} /> 확정
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {isIncoming ? `상대방: ${resolveAddressName(tx.fromAddress)}` : `수신자: ${resolveAddressName(tx.toAddress)}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', fontSize: '14px', color: isIncoming ? '#059669' : '#dc2626' }}>
                        {isIncoming ? `+${tx.amount}` : `-${tx.amount}`} {coinName.substring(0, 5)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽 컬럼: 송금 폼 & 1-Click 부스 결제 */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowRight size={18} color="var(--neon-purple)" /> {coinName} 코인 송금하기
        </h3>

        {visitor && (
          <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>수신자 주소</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="0xBooth_... 또는 0xVisitor_..." className="neon-input" required />
                <select
                  onChange={e => {
                    const val = e.target.value;
                    const b = booths.find(x => x.id === val);
                    if (b) { setSendTo(b.id); setSendAmount(b.cost); setSendPurpose(`부스 결제: ${b.name}`); }
                    const v = visitors.find(x => x.address === val);
                    if (v) { setSendTo(v.address); setSendAmount(10); setSendPurpose(`P2P 송금 (${v.name})`); }
                  }}
                  className="neon-input" style={{ width: '160px', padding: '6px', fontSize: '12px' }}
                >
                  <option value="">빠른 수신인 선택...</option>
                  <optgroup label="🎪 체험 부스">
                    {booths.map(b => <option key={b.id} value={b.id}>{b.name} ({b.cost}코인)</option>)}
                  </optgroup>
                  <optgroup label="👥 다른 관람객 (P2P)">
                    {visitors.filter(v => v.address !== visitor.address).map(v => <option key={v.address} value={v.address}>{v.name} 지갑</option>)}
                  </optgroup>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>송금 코인 수량</label>
                <input type="number" value={sendAmount} onChange={e => setSendAmount(parseInt(e.target.value) || 0)} min="1" className="neon-input" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>사용 목적 / 메모</label>
                <input type="text" value={sendPurpose} onChange={e => setSendPurpose(e.target.value)} className="neon-input" required />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>비밀키 (트랜잭션 서명용)</label>
              <input type="password" value={enteredKey} onChange={e => setEnteredKey(e.target.value)} placeholder="pv_..." className="neon-input" required />
              <span style={{ fontSize: '10px', color: '#4338ca', marginTop: '4px', display: 'block' }}>
                내 비밀키: <code style={{ color: '#0f172a', fontWeight: '700' }}>{visitor.privateKey}</code>
              </span>
            </div>
            <button type="submit" disabled={isCoinExpired} className="neon-btn btn-primary" style={{ width: '100%', padding: '13px', opacity: isCoinExpired ? 0.5 : 1 }}>
              <Lock size={15} /> 🔒 트랜잭션 서명 및 송금 실행
            </button>
          </form>
        )}

        <div className="glass-card" style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Zap size={13} color="#d97706" /> ⚡ 원클릭 체험 부스 즉시 결제
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {booths.map(b => (
              <button
                key={b.id}
                onClick={() => handleOneClick(b)}
                disabled={isCoinExpired}
                className="neon-btn btn-secondary"
                style={{ padding: '6px 11px', borderRadius: '8px', fontSize: '11px', opacity: isCoinExpired ? 0.5 : 1 }}
              >
                {b.name} ({b.cost} 코인)
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

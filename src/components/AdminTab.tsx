import React, { useState } from 'react';
import { Settings, Coins, AlertTriangle, Sparkles, Activity } from 'lucide-react';
import { Blockchain } from '../blockchain';
import type { ToastType } from '../hooks/useToast';

interface AdminTabProps {
  blockchainRef: React.MutableRefObject<Blockchain>;
  blockchainTick: number;
  updateBlockchainState: () => void;
  difficulty: number;
  setDifficulty: (v: number) => void;
  miningReward: number;
  setMiningReward: (v: number) => void;
  minerAddress: string;
  setMinerAddress: (v: string) => void;
  autoMine: boolean;
  setAutoMine: (v: boolean) => void;
  isCoinExpired: boolean;
  addToast: (type: ToastType, title: string, message?: string) => void;
  onConfirm: (title: string, message: string, onOk: () => void) => void;
  setProcessedTxIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setOriginalTransactions: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

const PRESET_COINS = [
  { name: 'SciBlockChain', expiry: '2026-12-31', supply: 1000000, desc: '과학제전 행사용 표준 블록체인 토큰' },
  { name: 'SciEduToken', expiry: '2026-11-30', supply: 500000, desc: '학생 교육 및 실험 포인트 전용 코인' },
  { name: 'FestivalCoin', expiry: '2026-10-31', supply: 2000000, desc: '체험 부스 통합 결제 페스티벌 코인' },
];

export function AdminTab({
  blockchainRef, blockchainTick: _tick, updateBlockchainState,
  difficulty, setDifficulty, miningReward, setMiningReward,
  minerAddress, setMinerAddress, autoMine, setAutoMine,
  isCoinExpired, addToast, onConfirm, setProcessedTxIds, setOriginalTransactions,
}: AdminTabProps) {
  const bc = blockchainRef.current;
  const [customCoinName, setCustomCoinName] = useState(bc.coinName);
  const [customExpiryDate, setCustomExpiryDate] = useState(bc.expiryDate);
  const [customTotalSupply, setCustomTotalSupply] = useState(bc.totalSupply);

  const stats = bc.getBlockStats();

  const handleMintCoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCoinName.trim()) {
      addToast('error', '입력 오류', '코인 이름을 입력해주세요.');
      return;
    }
    onConfirm(
      '신규 코인 발행 및 스마트 계약 배치',
      `코인 "${customCoinName}"을(를) 블록체인에 발행합니다.\n\n` +
      `· 토큰 이름: ${customCoinName}\n` +
      `· 유효기간: ${customExpiryDate}\n` +
      `· 최초 발행량: ${customTotalSupply.toLocaleString()} 개\n\n` +
      `이 작업은 기존 모든 원장을 초기화하고 신규 제네시스 블록을 마이닝합니다. 진행하시겠습니까?`,
      async () => {
        const newBc = new Blockchain(customCoinName, customExpiryDate, customTotalSupply);
        newBc.difficulty = difficulty;
        newBc.miningReward = miningReward;
        blockchainRef.current = newBc;
        setProcessedTxIds({});
        setOriginalTransactions({});
        updateBlockchainState();
        addToast('success', `${customCoinName} 토큰 민팅 완료!`, `${customTotalSupply.toLocaleString()} 개 공급으로 블록체인이 재시작되었습니다.`);
      }
    );
  };

  const applyPreset = (preset: typeof PRESET_COINS[0]) => {
    setCustomCoinName(preset.name);
    setCustomExpiryDate(preset.expiry);
    setCustomTotalSupply(preset.supply);
    addToast('info', '프리셋 설정 적용', `"${preset.name}" 프리셋 값이 서식에 채워졌습니다. 하단의 발행 버튼을 누르세요.`);
  };

  const handleReset = () => {
    onConfirm(
      '블록체인 원장 전체 초기화',
      '현재 블록체인의 전체 거래 내역을 리셋하고 초기화하시겠습니까?\n이 작업은 복구할 수 없습니다.',
      () => {
        const newBc = new Blockchain(bc.coinName, bc.expiryDate, bc.totalSupply);
        newBc.difficulty = difficulty;
        newBc.miningReward = miningReward;
        blockchainRef.current = newBc;
        setProcessedTxIds({});
        setOriginalTransactions({});
        updateBlockchainState();
        addToast('info', '원장 초기화 완료', '새로운 제네시스 블록으로 초기화되었습니다.');
      }
    );
  };

  return (
    <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* TOP BANNER / TITLE */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(245,158,11,0.1))',
        border: '1px solid rgba(139,92,246,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #7c3aed, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(124,58,237,0.4)'
          }}>
            <Coins size={28} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'white' }}>
              🛡️ 시스템 관리자 관제 센터 (Admin Control Center)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
              신규 코인 민팅, 스마트 계약 설정, 네트워크 채굴 난이도 조절 및 원장 무결성을 관제합니다.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>현재 활성 코인</span>
            <strong style={{ fontSize: '14px', color: '#fbbf24' }}>{bc.coinName}</strong>
          </div>
          <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>총 블록 수</span>
            <strong style={{ fontSize: '14px', color: '#60a5fa' }}>{bc.chain.length} 개</strong>
          </div>
        </div>
      </div>

      {/* SECTION 1: PROMINENT COIN ISSUANCE PANEL (최상단 코인 발행 메뉴) */}
      <div className="glass-card" style={{
        padding: '28px',
        border: '2px solid rgba(245,158,11,0.4)',
        boxShadow: '0 10px 40px rgba(245,158,11,0.15)',
        background: 'linear-gradient(180deg, rgba(245,158,11,0.06) 0%, rgba(13,18,36,0.6) 100%)',
        display: 'flex', flexDirection: 'column', gap: '22px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ padding: '3px 10px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>
                핵심 어드민 메뉴
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={22} color="#fbbf24" />
                🪙 신규 코인 발행 &amp; 스마트 계약 구동 (Coin Issuance &amp; Minting)
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
              토큰 명칭, 유효기간, 제네시스 공급량을 설정하여 블록체인 네트워크 상에 신규 암호화폐를 구동하고 제네시스 블록을 생성합니다.
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div>
          <label style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} /> 추천 토큰 프리셋 템플릿 (원클릭 선택)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            {PRESET_COINS.map(p => (
              <div
                key={p.name}
                onClick={() => applyPreset(p)}
                className="glass-card"
                style={{
                  padding: '12px 16px', cursor: 'pointer',
                  border: customCoinName === p.name ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.08)',
                  background: customCoinName === p.name ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '14px', color: 'white' }}>{p.name}</strong>
                  <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '700' }}>{p.supply.toLocaleString()} 개</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Issuance Form */}
        <form onSubmit={handleMintCoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(7,9,19,0.5)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
                1. 코인 심볼 이름 (Token Name)
              </label>
              <input
                type="text"
                value={customCoinName}
                onChange={e => setCustomCoinName(e.target.value)}
                placeholder="예: SciBlockChain, SciEduToken"
                className="neon-input"
                style={{ fontSize: '14px', padding: '10px 14px' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
                2. 토큰 유효기간 (Expiry Date)
              </label>
              <input
                type="date"
                value={customExpiryDate}
                onChange={e => setCustomExpiryDate(e.target.value)}
                className="neon-input"
                style={{ fontSize: '14px', padding: '10px 14px' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
                3. 제네시스 최초 발행량 (Genesis Total Supply)
              </label>
              <input
                type="number"
                value={customTotalSupply}
                onChange={e => setCustomTotalSupply(parseInt(e.target.value) || 0)}
                min="100"
                className="neon-input"
                style={{ fontSize: '14px', padding: '10px 14px' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="neon-btn btn-primary"
            style={{
              width: '100%', padding: '16px', fontSize: '16px', fontWeight: '800', borderRadius: '12px',
              background: 'linear-gradient(135deg, #fbbf24, #d97706, #b45309)',
              boxShadow: '0 6px 25px rgba(245,158,11,0.35)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '6px'
            }}
          >
            <Coins size={20} />
            🚀 신규 코인 발행 및 스마트 계약 배포 (Mint &amp; Deploy)
          </button>
        </form>

        {/* Active Coin Status Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '14px 18px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>현재 구동 코인:</span>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fbbf24' }}>{bc.coinName}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>유효기간 상태:</span>
            <div style={{ fontSize: '15px', fontWeight: '700', color: isCoinExpired ? '#ef4444' : '#10b981' }}>
              {bc.expiryDate} {isCoinExpired ? '(만료됨)' : '(활성화)'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>총 제네시스 공급량:</span>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{bc.totalSupply.toLocaleString()} 개</div>
          </div>
        </div>
      </div>

      {/* LOWER GRID: NETWORK PARAMS & DANGER ZONE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>

        {/* SECTION 2: NETWORK PARAMETERS */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} color="var(--neon-blue)" />
            ⚙️ 블록체인 네트워크 매개변수 설정
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                작업 증명 (PoW) 채굴 난이도 (1 ~ 4): <strong style={{ color: '#60a5fa' }}>Level {difficulty}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="4"
                value={difficulty}
                onChange={e => setDifficulty(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--neon-blue)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>난이도 1 (즉시 생성)</span>
                <span>{difficulty >= 3 ? '난이도 높음 (수초 소요)' : '보통'}</span>
                <span>난이도 4 (복잡)</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                블록 채굴 보상액 ({bc.coinName})
              </label>
              <input
                type="number"
                value={miningReward}
                onChange={e => setMiningReward(parseInt(e.target.value) || 0)}
                className="neon-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                마이너(Miner) 수수료 수취 지갑 주소
              </label>
              <input
                type="text"
                value={minerAddress}
                onChange={e => setMinerAddress(e.target.value)}
                className="neon-input"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'white', display: 'block' }}>트랜잭션 즉시 자동 채굴 (Auto-Mine)</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TX 발생 시 멤풀 대기 없이 자동 채굴을 돌립니다.</span>
              </div>
              <input
                type="checkbox"
                checked={autoMine}
                onChange={e => setAutoMine(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--neon-emerald)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: SYSTEM MONITOR & RESET */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--neon-purple)" />
            📊 원장 상태 및 비상 제어 (Danger Zone)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>누적 블록</span>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>{bc.chain.length} 개</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>총 처리 TX</span>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>{stats.totalTxCount} 건</div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ fontSize: '13px', color: 'white', marginBottom: '4px', fontWeight: '700' }}>💡 어드민 관제 안내</h4>
            <p>
              본 시스템은 과학전람회 행사용 코인 경제 시뮬레이터입니다. 신규 토큰 발행 시 전체 블록체인이 재시작되며 새로운 스마트 계약 환경이 구성됩니다.
            </p>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', marginTop: 'auto' }}>
            <button
              onClick={handleReset}
              className="neon-btn btn-danger"
              style={{
                width: '100%', padding: '13px', borderRadius: '10px', fontSize: '13px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <AlertTriangle size={16} />
              💥 원장 전체 초기화 (Reset Ledger)
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

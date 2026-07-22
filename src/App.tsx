import { useState } from 'react';
import {
  Wallet, QrCode, Database, BarChart2,
  Zap, ShieldAlert, Shield, LogOut, Home, Coins
} from 'lucide-react';
import type { Booth, VisitorWallet, ReceiptData } from './types';
import { makeWallet } from './types';
import { useBlockchain } from './hooks/useBlockchain';
import { useToast } from './hooks/useToast';
import { Toast } from './components/Toast';
import { NetworkStatsBar } from './components/NetworkStatsBar';
import { CardPaymentModal } from './components/CardPaymentModal';
import { TransactionReceipt } from './components/TransactionReceipt';
import { WalletTab } from './components/WalletTab';
import { BoothTab } from './components/BoothTab';
import { ExplorerTab } from './components/ExplorerTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { AdminTab } from './components/AdminTab';
import { LandingScreen } from './components/LandingScreen';
import { AdminLoginModal } from './components/AdminLoginModal';

type ActiveTab = 'wallet' | 'booth' | 'explorer' | 'analytics' | 'settings';
type ViewMode = 'landing' | 'app';

const DEFAULT_BOOTHS: Booth[] = [
  { id: '0xBooth_a1b2c3d4', name: '로켓 부스', description: '나만의 미니 로켓을 제작하고 발사해보는 과학 실험', cost: 30, visits: 0, revenue: 0 },
  { id: '0xBooth_e5f6a7b8', name: '화학 실험 부스', description: '색이 변하는 신기한 화학 반응 실험 체험', cost: 20, visits: 0, revenue: 0 },
  { id: '0xBooth_c9d0e1f2', name: 'DNA 추출 부스', description: '딸기에서 DNA를 직접 추출해보는 생명과학 실험', cost: 25, visits: 0, revenue: 0 },
  { id: '0xBooth_a3b4c5d6', name: '3D 프린팅 부스', description: '3D 모델링 기초와 실제 출력 체험', cost: 40, visits: 0, revenue: 0 },
];

function ConfirmModal({ config, onClose }: {
  config: { show: boolean; title: string; message: string; onOk: () => void };
  onClose: () => void;
}) {
  if (!config.show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div className="glass-card" style={{ width: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 20px 50px rgba(59,130,246,0.25)', animation: 'fadeIn 0.2s ease' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'white' }}>{config.title}</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{config.message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="neon-btn btn-secondary" style={{ padding: '8px 20px', fontSize: '13px' }}>취소</button>
          <button onClick={() => { config.onOk(); onClose(); }} className="neon-btn btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>확인</button>
        </div>
      </div>
    </div>
  );
}

function ExpiredBanner({ expiryDate }: { expiryDate: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{ margin: '0 16px 10px', padding: '10px 16px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldAlert size={16} color="#ef4444" />
        <span style={{ fontSize: '13px', color: '#f87171', fontWeight: '600' }}>코인 유효기간 만료됨 ({expiryDate}) — 어드민 탭에서 재발행하세요.</span>
      </div>
      <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>✕</button>
    </div>
  );
}

export default function App() {
  const {
    blockchainRef, blockchainTick, updateBlockchainState,
    isMining, miningProgress,
    difficulty, setDifficulty, miningReward, setMiningReward,
    minerAddress, setMinerAddress, autoMine, setAutoMine,
    isChainHealthy, isCoinExpired,
    runMiningProcess, reMineChainFrom,
  } = useBlockchain();

  const { toasts, addToast, removeToast } = useToast();

  // Mode and authentication state
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('wallet');

  // Booth state
  const [booths, setBooths] = useState<Booth[]>(DEFAULT_BOOTHS);
  const [activeBoothId, setActiveBoothId] = useState(DEFAULT_BOOTHS[0].id);

  // Multi-visitor state
  const [visitors, setVisitors] = useState<VisitorWallet[]>([
    makeWallet('이과학'),
    makeWallet('박과학'),
  ]);
  const [activeVisitorIndex, setActiveVisitorIndex] = useState(0);

  // Transaction state
  const [processedTxIds, setProcessedTxIds] = useState<Record<string, boolean>>({});
  const [originalTransactions, setOriginalTransactions] = useState<Record<string, number>>({});

  // Modals
  const [showCardModal, setShowCardModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [confirmConfig, setConfirmConfig] = useState({ show: false, title: '', message: '', onOk: () => {} });

  const openConfirm = (title: string, message: string, onOk: () => void) => {
    setConfirmConfig({ show: true, title, message, onOk });
  };
  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, show: false }));

  const addVisitor = (name: string) => {
    if (visitors.length >= 6) { addToast('warning', '지갑 한도 초과', '최대 6개의 관람객 지갑을 만들 수 있습니다.'); return; }
    const newWallet = makeWallet(name);
    setVisitors(prev => [...prev, newWallet]);
    setActiveVisitorIndex(visitors.length);
    addToast('success', '지갑 생성!', `${name}의 지갑이 생성되었습니다.`);
  };

  const coinName = blockchainRef.current.coinName;
  const expiryDate = blockchainRef.current.expiryDate;

  // Handle tab click with permission check
  const handleTabClick = (tabId: ActiveTab) => {
    if (tabId === 'settings' && !isAdminAuthenticated) {
      addToast('info', '관리자 승인 필요', '어드민 메뉴를 이용하려면 관리자 승인이 필요합니다.');
      setShowAdminLoginModal(true);
      return;
    }
    setActiveTab(tabId);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setViewMode('app');
    setActiveTab('settings');
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    if (activeTab === 'settings') setActiveTab('wallet');
    addToast('info', '관리자 로그아웃', '일반 사용자 모드로 전환되었습니다.');
  };

  // Tab definitions
  const userTabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'wallet',    label: '관람객 지갑', icon: <Wallet size={16} /> },
    { id: 'booth',     label: '체험 부스',   icon: <QrCode size={16} /> },
    { id: 'explorer',  label: '블록 탐색기', icon: <Database size={16} /> },
    { id: 'analytics', label: '분석 대시보드', icon: <BarChart2 size={16} /> },
  ];

  const adminTabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'settings',  label: '🪙 코인 발행 & 어드민 관제', icon: <Coins size={16} /> },
    { id: 'wallet',    label: '관람객 지갑 현황', icon: <Wallet size={16} /> },
    { id: 'booth',     label: '체험 부스 모니터', icon: <QrCode size={16} /> },
    { id: 'explorer',  label: '블록 탐색기', icon: <Database size={16} /> },
    { id: 'analytics', label: '분석 대시보드', icon: <BarChart2 size={16} /> },
  ];

  // Render Landing Screen if in landing viewMode
  if (viewMode === 'landing') {
    return (
      <>
        <LandingScreen
          blockchainRef={blockchainRef}
          blockchainTick={blockchainTick}
          onEnterUserMode={() => { setViewMode('app'); if (!isAdminAuthenticated) setActiveTab('wallet'); }}
          onOpenAdminLogin={() => setShowAdminLoginModal(true)}
        />
        <AdminLoginModal
          show={showAdminLoginModal}
          onClose={() => setShowAdminLoginModal(false)}
          onSuccess={handleAdminLoginSuccess}
          addToast={addToast}
        />
        <Toast toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  const activeTabs = isAdminAuthenticated ? adminTabs : userTabs;

  return (
    <div id="app-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>

      {/* HEADER */}
      <header style={{
        padding: '14px 24px',
        background: isAdminAuthenticated
          ? 'linear-gradient(90deg, rgba(139,92,246,0.18), rgba(7,9,19,0.95))'
          : 'rgba(7,9,19,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: isAdminAuthenticated
          ? '1px solid rgba(139,92,246,0.4)'
          : '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            onClick={() => setViewMode('landing')}
            style={{
              cursor: 'pointer', width: '40px', height: '40px', borderRadius: '12px',
              background: isAdminAuthenticated
                ? 'linear-gradient(135deg, #7c3aed, #d97706)'
                : 'linear-gradient(135deg, #1e40af, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isAdminAuthenticated ? '0 4px 15px rgba(124,58,237,0.4)' : '0 4px 15px rgba(59,130,246,0.3)'
            }}
          >
            <Zap size={22} color="white" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '19px', fontWeight: '800', background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {coinName}
              </h1>
              {isAdminAuthenticated ? (
                <span style={{ fontSize: '11px', background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(245,158,11,0.3))', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.5)', padding: '3px 10px', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={12} /> 🛡️ 관리자 승인됨
                </span>
              ) : (
                <span style={{ fontSize: '11px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', padding: '3px 10px', borderRadius: '12px', fontWeight: '600' }}>
                  관람객 모드
                </span>
              )}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {isAdminAuthenticated ? '시스템 관리자 전용 어드민 관제 센터' : '과학제전 블록체인 부스 결제 시뮬레이션 시스템'}
            </p>
          </div>
        </div>

        {/* Header Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setViewMode('landing')}
            className="neon-btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
          >
            <Home size={13} /> 첫화면
          </button>

          {isAdminAuthenticated ? (
            <button
              onClick={handleLogout}
              className="neon-btn btn-danger"
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
            >
              <LogOut size={13} /> 관리자 로그아웃
            </button>
          ) : (
            <button
              onClick={() => setShowAdminLoginModal(true)}
              className="neon-btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
            >
              <Shield size={13} /> 관리자 로그인
            </button>
          )}

          {/* Chain health badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: isChainHealthy ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '20px', border: `1px solid ${isChainHealthy ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
            {isChainHealthy
              ? <><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /><span style={{ fontSize: '11px', color: '#34d399', fontWeight: '600' }}>Chain OK</span></>
              : <><ShieldAlert size={12} color="#ef4444" className="animate-pulse" /><span style={{ fontSize: '11px', color: '#f87171', fontWeight: '600' }}>위변조 감지</span></>
            }
          </div>
        </div>
      </header>

      {/* NETWORK STATS BAR */}
      <NetworkStatsBar
        blockchainRef={blockchainRef}
        blockchainTick={blockchainTick}
        isChainHealthy={isChainHealthy}
        isMining={isMining}
        miningProgress={miningProgress}
      />

      {/* Expired banner */}
      {isCoinExpired && <ExpiredBanner expiryDate={expiryDate} />}

      {/* TAB NAV */}
      <nav style={{ display: 'flex', gap: '6px', padding: '0 16px 12px', overflowX: 'auto' }}>
        {activeTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => handleTabClick(tab.id)}
              className={`neon-btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '9px 18px', borderRadius: '10px', fontSize: '13px', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '6px', fontWeight: isActive ? '700' : '500',
                background: isActive && isAdminAuthenticated && tab.id === 'settings'
                  ? 'linear-gradient(135deg, #7c3aed, #d97706)'
                  : undefined,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '0 16px 24px' }}>
        {activeTab === 'wallet' && (
          <WalletTab
            blockchainRef={blockchainRef}
            blockchainTick={blockchainTick}
            updateBlockchainState={updateBlockchainState}
            isCoinExpired={isCoinExpired}
            autoMine={autoMine}
            booths={booths}
            activeBoothId={activeBoothId}
            visitors={visitors}
            activeVisitorIndex={activeVisitorIndex}
            setActiveVisitorIndex={setActiveVisitorIndex}
            onAddVisitor={addVisitor}
            onShowCardModal={() => setShowCardModal(true)}
            onShowReceipt={setReceiptData}
            addToast={addToast}
            runMiningProcess={runMiningProcess}
          />
        )}

        {activeTab === 'booth' && (
          <BoothTab
            blockchainRef={blockchainRef}
            blockchainTick={blockchainTick}
            updateBlockchainState={updateBlockchainState}
            isCoinExpired={isCoinExpired}
            isMining={isMining}
            autoMine={autoMine}
            booths={booths}
            setBooths={setBooths}
            activeBoothId={activeBoothId}
            setActiveBoothId={setActiveBoothId}
            processedTxIds={processedTxIds}
            setProcessedTxIds={setProcessedTxIds}
            runMiningProcess={runMiningProcess}
            onShowReceipt={setReceiptData}
            addToast={addToast}
          />
        )}

        {activeTab === 'explorer' && (
          <ExplorerTab
            blockchainRef={blockchainRef}
            blockchainTick={blockchainTick}
            difficulty={difficulty}
            miningReward={miningReward}
            isMining={isMining}
            miningProgress={miningProgress}
            isChainHealthy={isChainHealthy}
            originalTransactions={originalTransactions}
            setOriginalTransactions={setOriginalTransactions}
            runMiningProcess={runMiningProcess}
            reMineChainFrom={reMineChainFrom}
            addToast={addToast}
            updateBlockchainState={updateBlockchainState}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            blockchainRef={blockchainRef}
            blockchainTick={blockchainTick}
            booths={booths}
          />
        )}

        {activeTab === 'settings' && isAdminAuthenticated && (
          <AdminTab
            blockchainRef={blockchainRef}
            blockchainTick={blockchainTick}
            updateBlockchainState={updateBlockchainState}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            miningReward={miningReward}
            setMiningReward={setMiningReward}
            minerAddress={minerAddress}
            setMinerAddress={setMinerAddress}
            autoMine={autoMine}
            setAutoMine={setAutoMine}
            isCoinExpired={isCoinExpired}
            addToast={addToast}
            onConfirm={openConfirm}
            setProcessedTxIds={setProcessedTxIds}
            setOriginalTransactions={setOriginalTransactions}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ padding: '14px 24px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(7,9,19,0.8)' }}>
        © 2026 {coinName} Blockchain EcoSystem · 과학전람회 블록체인 결제 시뮬레이터 v2.0
      </footer>

      {/* CARD PAYMENT MODAL */}
      <CardPaymentModal
        show={showCardModal}
        onClose={() => setShowCardModal(false)}
        visitor={visitors[activeVisitorIndex]}
        blockchain={blockchainRef}
        updateBlockchainState={updateBlockchainState}
        autoMine={autoMine}
        runMiningProcess={runMiningProcess}
        addToast={addToast}
      />

      {/* TRANSACTION RECEIPT MODAL */}
      <TransactionReceipt data={receiptData} onClose={() => setReceiptData(null)} />

      {/* ADMIN LOGIN MODAL */}
      <AdminLoginModal
        show={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={handleAdminLoginSuccess}
        addToast={addToast}
      />

      {/* CONFIRM DIALOG */}
      <ConfirmModal config={confirmConfig} onClose={closeConfirm} />

      {/* TOAST NOTIFICATIONS */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

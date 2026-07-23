import { useState } from 'react';
import {
  Wallet, QrCode, Database, BarChart2,
  Zap, ShieldAlert, Shield, LogOut, Home, Coins
} from 'lucide-react';
import type { Booth, ReceiptData } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VisitorProvider, useVisitors } from './context/VisitorContext';
import { BlockchainProvider, useBlockchainContext } from './context/BlockchainContext';
import {
  useBlockchainPersistence, loadSavedBooths, loadSavedProcessedTxs
} from './hooks/useBlockchainPersistence';
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
import { VisitorLoginScreen } from './components/VisitorLoginScreen';

type ActiveTab = 'wallet' | 'booth' | 'explorer' | 'analytics' | 'settings';
type ViewMode = 'landing' | 'visitorLogin' | 'app';

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
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div className="glass-card" style={{ width: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(147,197,253,0.6)', boxShadow: '0 20px 50px rgba(148,163,184,0.2)', animation: 'fadeIn 0.2s ease', background: '#ffffff' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{config.title}</h3>
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{config.message}</p>
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
    <div style={{ margin: '0 16px 10px', padding: '10px 16px', background: 'rgba(254,226,226,0.8)', border: '1px solid rgba(252,165,165,0.8)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldAlert size={16} color="#dc2626" />
        <span style={{ fontSize: '13px', color: '#b91c1c', fontWeight: '600' }}>코인 유효기간 만료됨 ({expiryDate}) — 어드민 탭에서 재발행하세요.</span>
      </div>
      <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>✕</button>
    </div>
  );
}

function MainApp() {
  const {
    blockchainRef, blockchainTick, updateBlockchainState,
    isMining, miningProgress,
    difficulty, setDifficulty, miningReward, setMiningReward,
    minerAddress, setMinerAddress, autoMine, setAutoMine,
    isChainHealthy, isCoinExpired,
    runMiningProcess, reMineChainFrom,
  } = useBlockchainContext();

  const { isAdminAuthenticated, logoutAdmin, loggedInVisitor, logoutVisitor } = useAuth();
  const { visitors, activeVisitorIndex, setActiveVisitorIndex, addVisitor: contextAddVisitor } = useVisitors();

  const { toasts, addToast, removeToast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('wallet');

  const [booths, setBooths] = useState<Booth[]>(() => loadSavedBooths() || DEFAULT_BOOTHS);
  const [activeBoothId, setActiveBoothId] = useState(DEFAULT_BOOTHS[0].id);

  const [processedTxIds, setProcessedTxIds] = useState<Record<string, boolean>>(() => loadSavedProcessedTxs() || {});
  const [originalTransactions, setOriginalTransactions] = useState<Record<string, number>>({});

  // Enable auto-persistence to localStorage
  useBlockchainPersistence(blockchainRef, blockchainTick, visitors, booths, processedTxIds);

  const [showCardModal, setShowCardModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [confirmConfig, setConfirmConfig] = useState({ show: false, title: '', message: '', onOk: () => {} });

  const openConfirm = (title: string, message: string, onOk: () => void) => {
    setConfirmConfig({ show: true, title, message, onOk });
  };
  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, show: false }));

  const addVisitor = (name: string) => {
    const success = contextAddVisitor(name);
    if (!success) {
      addToast('warning', '지갑 한도 초과', '최대 6개의 관람객 지갑을 만들 수 있습니다.');
    } else {
      addToast('success', '지갑 생성!', `${name}의 지갑이 생성되었습니다.`);
    }
  };

  const coinName = blockchainRef.current.coinName;
  const expiryDate = blockchainRef.current.expiryDate;

  const handleTabClick = (tabId: ActiveTab) => {
    if (tabId === 'settings' && !isAdminAuthenticated) {
      addToast('info', '관리자 승인 필요', '어드민 메뉴를 이용하려면 관리자 승인이 필요합니다.');
      setShowAdminLoginModal(true);
      return;
    }
    setActiveTab(tabId);
  };

  const handleAdminLoginSuccess = () => {
    setViewMode('app');
    setActiveTab('settings');
    const adminIdx = visitors.findIndex(v => v.loginId === 'admin');
    setActiveVisitorIndex(adminIdx >= 0 ? adminIdx : 0);
  };

  const handleLogout = () => {
    logoutAdmin();
    logoutVisitor();
    setActiveVisitorIndex(-1);
    setViewMode('landing');
    setActiveTab('wallet');
    addToast('info', '로그아웃 완료', '모든 세션이 종료되고 메인 화면으로 이동합니다.');
  };

  const handleVisitorLogout = () => {
    logoutVisitor();
    setViewMode('visitorLogin');
    addToast('info', '로그아웃', '관람객 로그인 화면으로 돌아갑니다.');
  };

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

  if (viewMode === 'landing') {
    return (
      <>
        <LandingScreen
          blockchainRef={blockchainRef}
          blockchainTick={blockchainTick}
          onEnterUserMode={() => setViewMode('visitorLogin')}
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

  if (viewMode === 'visitorLogin') {
    return (
      <>
        <VisitorLoginScreen
          onLoginSuccess={() => setViewMode('app')}
          addToast={addToast}
        />
        <Toast toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  const activeTabs = isAdminAuthenticated ? adminTabs : userTabs;

  return (
    <div id="app-root" className={isAdminAuthenticated ? 'mode-admin' : 'mode-visitor'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)' }}>

      {/* HEADER */}
      <header style={{
        padding: '14px 24px',
        background: isAdminAuthenticated ? '#fae8ff' : '#ffffff',
        borderBottom: isAdminAuthenticated ? '1px solid #e9d5ff' : '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            onClick={() => setViewMode('landing')}
            style={{
              cursor: 'pointer', width: '40px', height: '40px', borderRadius: '12px',
              backgroundColor: isAdminAuthenticated ? '#7c3aed' : '#4f46e5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isAdminAuthenticated ? '0 4px 12px rgba(124,58,237,0.2)' : '0 4px 12px rgba(79,70,229,0.2)'
            }}
          >
            <Zap size={22} color="white" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '19px', fontWeight: '800', color: isAdminAuthenticated ? '#6b21a8' : '#4338ca' }}>
                {coinName}
              </h1>
              {isAdminAuthenticated ? (
                <span className="badge-admin" style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={12} /> 🛡️ 관리자 승인됨
                </span>
              ) : (
                <span className="badge-visitor" style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>
                  관람객 모드
                </span>
              )}
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
              {isAdminAuthenticated ? '시스템 관리자 전용 어드민 관제 센터' : '과학제전 블록체인 부스 결제 시스템'}
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
          ) : !loggedInVisitor ? (
            <button
              onClick={() => setShowAdminLoginModal(true)}
              className="neon-btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', backgroundColor: '#7c3aed' }}
            >
              <Shield size={13} /> 관리자 로그인
            </button>
          ) : null}

          {/* Chain health badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: isChainHealthy ? '#ccfbf1' : '#fee2e2', borderRadius: '20px', border: `1px solid ${isChainHealthy ? '#99f6e4' : '#fca5a5'}` }}>
            {isChainHealthy
              ? <><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0d9488' }} /><span style={{ fontSize: '11px', color: '#0f766e', fontWeight: '600' }}>체인 정상</span></>
              : <><ShieldAlert size={12} color="#dc2626" className="animate-pulse" /><span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '600' }}>위변조 감지</span></>
            }
          </div>

          {/* 관람객 로그아웃 버튼 (관리자 모드 아닐 때) */}
          {!isAdminAuthenticated && loggedInVisitor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#f0fdf4', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: '12px', color: '#166534', fontWeight: '600' }}>👤 {loggedInVisitor.name}</span>
              <button
                onClick={handleVisitorLogout}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '11px', padding: '0', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <LogOut size={12} />
              </button>
            </div>
          )}
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
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '0 16px 12px', overflowX: 'auto', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
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
                  backgroundColor: isActive && isAdminAuthenticated && tab.id === 'settings'
                    ? '#7c3aed'
                    : undefined,
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 관리자 모드에서 관람객 지갑 시뮬레이션 활성화 표시 */}
        {isAdminAuthenticated && visitors[activeVisitorIndex] && (
          <div style={{
            fontSize: '14px',
            fontWeight: '800',
            color: '#4f46e5',
            background: '#eff6ff',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: 'auto',
            boxShadow: '0 4px 10px rgba(79,70,229,0.08)'
          }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
            <span>👤 <strong>{visitors[activeVisitorIndex].name}</strong> 님 지갑 사용 중</span>
          </div>
        )}
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
            loggedInVisitor={loggedInVisitor || undefined}
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
            activeBoothId={activeBoothId}
            setActiveBoothId={setActiveBoothId}
            processedTxIds={processedTxIds}
            setProcessedTxIds={setProcessedTxIds}
            runMiningProcess={runMiningProcess}
            onShowReceipt={setReceiptData}
            addToast={addToast}
            visitors={visitors}
            activeVisitorIndex={activeVisitorIndex}
            loggedInVisitor={loggedInVisitor || undefined}
            isAdmin={isAdminAuthenticated}
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
            isAdmin={isAdminAuthenticated}
            currentVisitor={loggedInVisitor || visitors[activeVisitorIndex]}
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
            booths={booths}
            setBooths={setBooths}
            setActiveBoothId={setActiveBoothId}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ padding: '14px 24px', textAlign: 'center', fontSize: '11px', color: '#64748b', borderTop: '1px solid rgba(226,232,240,0.8)', background: 'rgba(255,255,255,0.7)' }}>
        © 2026 {coinName} Blockchain EcoSystem · 과학전람회 블록체인 결제 시스템 v2.0
      </footer>

      {/* CARD PAYMENT MODAL */}
      <CardPaymentModal
        show={showCardModal}
        onClose={() => setShowCardModal(false)}
        visitor={loggedInVisitor || visitors[activeVisitorIndex]}
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

export default function App() {
  return (
    <AuthProvider>
      <VisitorProvider>
        <BlockchainProvider>
          <MainApp />
        </BlockchainProvider>
      </VisitorProvider>
    </AuthProvider>
  );
}


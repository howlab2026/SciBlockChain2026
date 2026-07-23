import React, { useState, useRef, useEffect } from 'react';
import { User, Lock, Wifi, UserPlus, ArrowRight, Eye, EyeOff, Zap, LogIn } from 'lucide-react';
import { useVisitors } from '../context/VisitorContext';
import { useAuth } from '../context/AuthContext';
import type { ToastType } from '../hooks/useToast';

interface VisitorLoginScreenProps {
  onLoginSuccess: () => void;
  addToast: (type: ToastType, title: string, message?: string) => void;
}

type LoginTab = 'login' | 'register' | 'rfid';

export function VisitorLoginScreen({ onLoginSuccess, addToast }: VisitorLoginScreenProps) {
  const { authenticateVisitor, authenticateByRfid, registerVisitor } = useVisitors();
  const { loginVisitor } = useAuth();

  const [activeTab, setActiveTab] = useState<LoginTab>('login');

  // 로그인 폼
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 회원가입 폼
  const [regName, setRegName] = useState('');
  const [regId, setRegId] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regPw2, setRegPw2] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // RFID
  const [rfidValue, setRfidValue] = useState('');
  const [rfidError, setRfidError] = useState('');
  const [rfidScanning, setRfidScanning] = useState(false);
  const rfidRef = useRef<HTMLInputElement>(null);

  // RFID 탭 진입 시 포커스
  useEffect(() => {
    if (activeTab === 'rfid' && rfidRef.current) {
      rfidRef.current.focus();
    }
  }, [activeTab]);

  // RFID 입력 감지 - 일정 시간 내 빠른 입력 시 자동 로그인
  const rfidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRfidChange = (val: string) => {
    setRfidValue(val);
    setRfidError('');
    if (rfidTimerRef.current) clearTimeout(rfidTimerRef.current);
    if (val.length >= 4) {
      setRfidScanning(true);
      rfidTimerRef.current = setTimeout(() => {
        setRfidScanning(false);
        handleRfidLogin(val);
      }, 500);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    setTimeout(() => {
      const visitor = authenticateVisitor(loginId.trim(), loginPw);
      setIsLoggingIn(false);
      if (visitor) {
        loginVisitor(visitor);
        addToast('success', `환영합니다, ${visitor.name} 님!`, '관람객 지갑에 접속되었습니다.');
        onLoginSuccess();
      } else {
        setLoginError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    }, 600);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    if (regPw !== regPw2) {
      setRegError('비밀번호가 일치하지 않습니다.');
      return;
    }
    const result = registerVisitor(regName.trim(), regId.trim(), regPw);
    if (result.ok) {
      setRegSuccess(`"${regId}" 계정이 생성되었습니다! 이제 로그인하세요.`);
      setRegName(''); setRegId(''); setRegPw(''); setRegPw2('');
      setTimeout(() => {
        setRegSuccess('');
        setActiveTab('login');
        setLoginId(regId);
      }, 1800);
    } else {
      setRegError(result.error || '등록 실패');
    }
  };

  const handleRfidLogin = (uid: string) => {
    const visitor = authenticateByRfid(uid.trim());
    if (visitor) {
      loginVisitor(visitor);
      addToast('success', `📡 RFID 인식 완료! ${visitor.name} 님 환영합니다.`, '지갑에 접속되었습니다.');
      onLoginSuccess();
    } else {
      setRfidError('등록되지 않은 RFID 카드입니다. 안내 직원에게 문의하세요.');
      setRfidValue('');
    }
  };

  const tabStyle = (tab: LoginTab): React.CSSProperties => ({
    flex: 1, padding: '10px 6px', fontSize: '13px', fontWeight: '700',
    border: 'none', cursor: 'pointer', borderRadius: '10px',
    transition: 'all 0.2s ease',
    background: activeTab === tab ? '#4f46e5' : 'transparent',
    color: activeTab === tab ? 'white' : '#64748b',
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#f1f5f9', padding: '20px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Soft background orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.08), transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 18px',
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '20px', fontSize: '13px', color: '#4338ca', fontWeight: '700', marginBottom: '16px',
        }}>
          <Zap size={14} color="#4f46e5" /> 관람객 체험 모드
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e1b4b', letterSpacing: '-0.5px' }}>
          👤 관람객 로그인
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
          본인 계정으로 로그인하면 나만의 지갑에 접속됩니다.
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '420px',
        background: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 8px 40px rgba(148,163,184,0.15)',
        overflow: 'hidden',
        zIndex: 1,
        animation: 'fadeIn 0.3s ease',
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '6px', padding: '16px 16px 0',
          background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
        }}>
          <button style={tabStyle('login')} onClick={() => { setActiveTab('login'); setLoginError(''); }}>
            <LogIn size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
            로그인
          </button>
          <button style={tabStyle('register')} onClick={() => { setActiveTab('register'); setRegError(''); setRegSuccess(''); }}>
            <UserPlus size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
            회원가입
          </button>
          <button style={tabStyle('rfid')} onClick={() => { setActiveTab('rfid'); setRfidError(''); setRfidValue(''); }}>
            <Wifi size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
            RFID 카드
          </button>
        </div>

        <div style={{ padding: '28px' }}>
          {/* ─── 로그인 탭 ─── */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '600', marginBottom: '6px' }}>
                  관람객 아이디
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={loginId}
                    onChange={e => { setLoginId(e.target.value); setLoginError(''); }}
                    placeholder=""
                    autoComplete="off"
                    className="neon-input"
                    style={{ paddingLeft: '36px' }}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '600', marginBottom: '6px' }}>
                  비밀번호
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={loginPw}
                    onChange={e => { setLoginPw(e.target.value); setLoginError(''); }}
                    placeholder=""
                    autoComplete="new-password"
                    className="neon-input"
                    style={{ paddingLeft: '36px', paddingRight: '36px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div style={{ fontSize: '12px', color: '#b91c1c', background: '#fef2f2', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  ⚠️ {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="neon-btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700', marginTop: '4px', borderRadius: '12px', backgroundColor: '#4f46e5' }}
              >
                {isLoggingIn ? '인증 중...' : <><ArrowRight size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />로그인</>}
              </button>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '4px' }}>
                💡 <strong>관람객 테스트 계정 힌트:</strong><br />
                ID <code style={{ color: '#4f46e5', fontWeight: '700' }}>sci001</code> / PW <code style={{ color: '#4f46e5', fontWeight: '700' }}>1234</code> (이과학)<br />
                ID <code style={{ color: '#4f46e5', fontWeight: '700' }}>sci002</code> / PW <code style={{ color: '#4f46e5', fontWeight: '700' }}>1234</code> (박과학)<br />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>(또는 회원가입 탭에서 신규 계정 직접 생성)</span>
              </div>
            </form>
          )}

          {/* ─── 회원가입 탭 ─── */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '600', marginBottom: '6px' }}>
                  이름 (표시용)
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => { setRegName(e.target.value); setRegError(''); }}
                  placeholder=""
                  className="neon-input"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '600', marginBottom: '6px' }}>
                  사용할 아이디 (4자 이상)
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={regId}
                    onChange={e => { setRegId(e.target.value); setRegError(''); }}
                    placeholder=""
                    className="neon-input"
                    style={{ paddingLeft: '36px' }}
                    required
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '600', marginBottom: '6px' }}>
                  비밀번호 (4자 이상)
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={regPw}
                    onChange={e => { setRegPw(e.target.value); setRegError(''); }}
                    placeholder=""
                    className="neon-input"
                    style={{ paddingLeft: '36px', paddingRight: '36px' }}
                    required
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '600', marginBottom: '6px' }}>
                  비밀번호 확인
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={regPw2}
                    onChange={e => { setRegPw2(e.target.value); setRegError(''); }}
                    placeholder=""
                    className="neon-input"
                    style={{ paddingLeft: '36px' }}
                    required
                  />
                </div>
              </div>

              {regError && (
                <div style={{ fontSize: '12px', color: '#b91c1c', background: '#fef2f2', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  ⚠️ {regError}
                </div>
              )}
              {regSuccess && (
                <div style={{ fontSize: '12px', color: '#065f46', background: '#d1fae5', padding: '10px 12px', borderRadius: '8px', border: '1px solid #6ee7b7' }}>
                  ✅ {regSuccess}
                </div>
              )}

              <button
                type="submit"
                className="neon-btn btn-success"
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700', marginTop: '4px', borderRadius: '12px', backgroundColor: '#0d9488' }}
              >
                <UserPlus size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                가입 및 지갑 생성
              </button>
            </form>
          )}

          {/* ─── RFID 탭 ─── */}
          {activeTab === 'rfid' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* RFID 아이콘 애니메이션 영역 */}
              <div style={{
                textAlign: 'center', padding: '28px 20px',
                background: rfidScanning ? '#eff6ff' : '#f8fafc',
                borderRadius: '16px',
                border: `2px dashed ${rfidScanning ? '#4f46e5' : '#cbd5e1'}`,
                transition: 'all 0.3s ease',
              }}>
                <div style={{
                  fontSize: '48px', marginBottom: '12px',
                  animation: rfidScanning ? 'pulse 0.8s ease-in-out infinite' : 'none',
                }}>
                  📡
                </div>
                <p style={{ fontSize: '15px', fontWeight: '700', color: rfidScanning ? '#4338ca' : '#475569' }}>
                  {rfidScanning ? 'RFID 인식 중...' : 'RFID 카드를 리더기에 가까이 대세요'}
                </p>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  카드를 대면 자동으로 로그인됩니다
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '600', marginBottom: '6px' }}>
                  RFID UID (자동 입력 또는 직접 입력)
                </label>
                <input
                  ref={rfidRef}
                  type="text"
                  value={rfidValue}
                  onChange={e => handleRfidChange(e.target.value)}
                  placeholder=""
                  className="neon-input"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}
                />
              </div>

              {rfidError && (
                <div style={{ fontSize: '12px', color: '#b91c1c', background: '#fef2f2', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  ⚠️ {rfidError}
                </div>
              )}

              <button
                onClick={() => rfidValue && handleRfidLogin(rfidValue)}
                disabled={!rfidValue}
                className="neon-btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700', borderRadius: '12px', opacity: rfidValue ? 1 : 0.5, backgroundColor: '#4f46e5' }}
              >
                <Wifi size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                RFID로 로그인
              </button>

              <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                RFID 카드가 없으신가요? <button onClick={() => setActiveTab('login')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>ID/PW 로그인</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo notice */}
      <div style={{ marginTop: '20px', fontSize: '11px', color: '#94a3b8', textAlign: 'center', zIndex: 1 }}>
        🔬 과학제전 블록체인 부스 결제 시스템
      </div>
    </div>
  );
}

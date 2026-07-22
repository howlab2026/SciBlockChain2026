import React, { useState } from 'react';
import { Shield, Lock, User, X } from 'lucide-react';
import type { ToastType } from '../hooks/useToast';

interface AdminLoginModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  addToast: (type: ToastType, title: string, message?: string) => void;
}

export function AdminLoginModal({ show, onClose, onSuccess, addToast }: AdminLoginModalProps) {
  const [adminId, setAdminId] = useState('');
  const [adminPw, setAdminPw] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!show) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (adminId.trim() === 'admin' && adminPw === 'admin1234') {
        addToast('success', '관리자 승인 완료!', '시스템 관리자 권한이 부여되었습니다.');
        onSuccess();
        onClose();
        setAdminId('');
        setAdminPw('');
      } else {
        setErrorMsg('아이디 또는 비밀번호가 일치하지 않습니다. (테스트 계정: admin / admin1234)');
        addToast('error', '로그인 실패', '잘못된 관리자 인증 정보입니다.');
      }
    }, 600);
  };

  const handleQuickDemoLogin = () => {
    setAdminId('admin');
    setAdminPw('admin1234');
    setErrorMsg('');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(15,23,42,0.45)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999,
    }}>
      <div className="glass-card" style={{
        width: '400px', padding: '28px',
        display: 'flex', flexDirection: 'column', gap: '20px',
        border: '1px solid rgba(192,132,252,0.8)',
        boxShadow: '0 20px 60px rgba(148,163,184,0.25)',
        borderRadius: '20px', animation: 'fadeIn 0.25s ease',
        background: '#ffffff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color="#7c3aed" />
            관리자 승인 로그인
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
          블록체인 네트워크 제어, 신규 코인 발행 및 원장 리셋 권한을 얻으려면 관리자 승인이 필요합니다.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '6px', fontWeight: '600' }}>관리자 아이디 (ID)</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={adminId}
                onChange={e => setAdminId(e.target.value)}
                placeholder="admin"
                className="neon-input"
                style={{ paddingLeft: '36px' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '6px', fontWeight: '600' }}>비밀번호 (Password)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                value={adminPw}
                onChange={e => setAdminPw(e.target.value)}
                placeholder="admin1234"
                className="neon-input"
                style={{ paddingLeft: '36px' }}
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div style={{ fontSize: '11px', color: '#b91c1c', background: 'rgba(254,226,226,0.8)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(252,165,165,0.8)' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
            <span style={{ color: '#64748b' }}>테스트용 계정 정보: admin / admin1234</span>
            <button type="button" onClick={handleQuickDemoLogin} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}>
              자동 입력
            </button>
          </div>

          <button type="submit" disabled={isLoading} className="neon-btn btn-primary" style={{ width: '100%', padding: '13px', marginTop: '6px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            {isLoading ? '승인 확인 중...' : '관리자 승인 요청'}
          </button>
        </form>
      </div>
    </div>
  );
}

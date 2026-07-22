import React from 'react';
import { Zap, Wallet, Shield, ArrowRight, Server, Coins, Activity, CheckCircle } from 'lucide-react';
import { Blockchain } from '../blockchain';

interface LandingScreenProps {
  blockchainRef: React.MutableRefObject<Blockchain>;
  blockchainTick: number;
  onEnterUserMode: () => void;
  onOpenAdminLogin: () => void;
}

export function LandingScreen({
  blockchainRef, blockchainTick: _tick, onEnterUserMode, onOpenAdminLogin
}: LandingScreenProps) {
  const bc = blockchainRef.current;
  const stats = bc.getBlockStats();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'var(--bg-deep)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background soft aura glows */}
      <div style={{
        position: 'absolute', top: '-10%', left: '15%', width: '550px', height: '550px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(192,132,252,0.22), transparent 70%)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '15%', width: '550px', height: '550px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(147,197,253,0.25), transparent 70%)', pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '1000px', width: '100%', display: 'flex', flexDirection: 'column', gap: '40px', zIndex: 1 }}>

        {/* Hero title header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 18px',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '20px', fontSize: '13px', color: '#4338ca', fontWeight: '700'
          }}>
            <Zap size={15} color="#4f46e5" /> 과학제전 블록체인 시뮬레이션 포털 v2.0
          </div>

          <h1 style={{
            fontSize: '46px', fontWeight: '800', lineHeight: 1.2,
            background: 'linear-gradient(135deg, #1e293b 20%, #4338ca 60%, #6b21a8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px'
          }}>
            SciBlockChain EcoSystem
          </h1>

          <p style={{ fontSize: '16px', color: '#475569', maxWidth: '640px', lineHeight: 1.6 }}>
            체험 부스 결제, 카드 충전, 암호학 원장 검증 및 거래 분석을 실시간으로 시뮬레이션할 수 있는 교육용 파스텔 블록체인 플랫폼입니다.
          </p>
        </div>

        {/* 2 Main Role Selection Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>

          {/* User / Visitor Mode Card */}
          <div className="glass-card" style={{
            padding: '34px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px',
            border: '1px solid rgba(147,197,253,0.8)',
            boxShadow: '0 12px 35px rgba(147,197,253,0.25)',
            position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.92)'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(147,197,253,0.3), transparent 70%)', borderRadius: '50%' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 1 }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #e0e7ff, #ccfbf1)',
                border: '1px solid rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Wallet size={26} color="#4f46e5" />
              </div>

              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4338ca', fontWeight: '800' }}>General User Mode</span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                  관람객 &amp; 부스 체험 모드
                </h3>
              </div>

              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                관람객 가상 지갑 생성, 가상 카드 충전, 과학 체험 부스 QR 결제 및 공개 원장 탐색 기능을 자유롭게 이용합니다.
              </p>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#334155', marginTop: '4px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#0d9488" /> 다중 관람객 가상 지갑 &amp; 카드 충전</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#0d9488" /> 체험 부스 QR 결제 &amp; 영수증 출력</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#0d9488" /> 원장 탐색기 및 데이터 분석 대시보드</li>
              </ul>
            </div>

            <button
              onClick={onEnterUserMode}
              className="neon-btn btn-primary"
              style={{
                width: '100%', padding: '16px', fontSize: '15px', fontWeight: '700', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: 'linear-gradient(135deg, #6366f1, #0d9488)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.25)',
              }}
            >
              관람객 모드로 입장하기 <ArrowRight size={18} />
            </button>
          </div>

          {/* Admin Mode Card */}
          <div className="glass-card" style={{
            padding: '34px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px',
            border: '1px solid rgba(192,132,252,0.8)',
            boxShadow: '0 12px 35px rgba(192,132,252,0.25)',
            position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.92)'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(192,132,252,0.3), transparent 70%)', borderRadius: '50%' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 1 }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #f3e8ff, #fce7f3)',
                border: '1px solid rgba(168,85,247,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Shield size={26} color="#7c3aed" />
              </div>

              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#7e22ce', fontWeight: '800' }}>Authorized Mode</span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                  시스템 관리자 모드
                </h3>
              </div>

              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                아이디 및 비밀번호 승인을 거친 어드민 전용 화면입니다. 토큰 발행, 난이도 조정, 원장 초기화 제어가 가능합니다.
              </p>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#334155', marginTop: '4px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#7c3aed" /> 신규 코인 민팅 &amp; 유효기간 설정</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#7c3aed" /> 작업 증명(PoW) 채굴 난이도 제어</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#7c3aed" /> 블록체인 전체 원장 리셋 권한</li>
              </ul>
            </div>

            <button
              onClick={onOpenAdminLogin}
              className="neon-btn btn-secondary"
              style={{
                width: '100%', padding: '16px', fontSize: '15px', fontWeight: '700', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: 'linear-gradient(135deg, #f3e8ff, #fce7f3)',
                border: '1px solid rgba(168,85,247,0.5)', color: '#6b21a8',
              }}
            >
              <Shield size={18} /> 관리자 승인 로그인
            </button>
          </div>
        </div>

        {/* Bottom Network Summary */}
        <div className="glass-card" style={{
          padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          flexWrap: 'wrap', gap: '16px', border: '1px solid rgba(226,232,240,0.9)', background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={20} color="#4f46e5" />
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>현재 발행 블록</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{bc.chain.length} 개</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Coins size={20} color="#d97706" />
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>활성 토큰</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{bc.coinName}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="#0d9488" />
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>총 거래 건수</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{stats.totalTxCount} 건</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

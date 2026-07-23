import { Component, type ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { clearBlockchainStorage } from '../hooks/useBlockchainPersistence';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught Error in SciBlockChain App:', error, errorInfo);
  }

  private handleResetApp = () => {
    clearBlockchainStorage();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0f172a', color: 'white', padding: '24px', fontFamily: 'sans-serif'
        }}>
          <div className="glass-card" style={{
            maxWidth: '520px', width: '100%', padding: '32px', textAlign: 'center',
            background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '20px'
          }}>
            <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>시스템 런타임 오류가 발생했습니다</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px' }}>
              블록체인 원장 데이터 처리 중 예기치 못한 예외가 발생했습니다.<br />
              원장 저장소를 초기화하고 다시 실행할 수 있습니다.
            </p>
            <div style={{
              background: 'rgba(15,23,42,0.8)', padding: '12px', borderRadius: '10px',
              fontFamily: 'monospace', fontSize: '11px', color: '#f87171', marginBottom: '24px',
              textAlign: 'left', overflowX: 'auto'
            }}>
              {this.state.error?.message || 'Unknown Error'}
            </div>
            <button
              onClick={this.handleResetApp}
              className="neon-btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} /> 원장 데이터 초기화 후 복구
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

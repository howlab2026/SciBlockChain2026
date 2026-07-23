import { createContext, useContext, useState, type ReactNode } from 'react';
import type { VisitorWallet } from '../types';

interface AuthContextType {
  // 관리자 인증
  isAdminAuthenticated: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  // 관람객 인증
  loggedInVisitor: VisitorWallet | null;
  loginVisitor: (visitor: VisitorWallet) => void;
  logoutVisitor: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loggedInVisitor, setLoggedInVisitor] = useState<VisitorWallet | null>(null);

  const loginAdmin = (password: string): boolean => {
    if (password === 'admin1234') {
      setLoggedInVisitor(null);
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
  };

  const loginVisitor = (visitor: VisitorWallet) => {
    setLoggedInVisitor(visitor);
  };

  const logoutVisitor = () => {
    setLoggedInVisitor(null);
  };

  return (
    <AuthContext.Provider value={{
      isAdminAuthenticated, loginAdmin, logoutAdmin,
      loggedInVisitor, loginVisitor, logoutVisitor,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


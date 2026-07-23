import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import type { VisitorWallet } from '../types';
import { makeWallet, makeRfidWallet } from '../types';
import { loadSavedVisitors } from '../hooks/useBlockchainPersistence';

interface VisitorContextType {
  visitors: VisitorWallet[];
  activeVisitorIndex: number;
  activeVisitor: VisitorWallet;
  setActiveVisitorIndex: (index: number) => void;
  addVisitor: (name: string, loginId?: string, password?: string) => { ok: boolean; error?: string };
  updateVisitor: (index: number, name: string, loginId: string, password: string) => { ok: boolean; error?: string };
  setVisitors: Dispatch<SetStateAction<VisitorWallet[]>>;
  /** 자가 등록: 이름 + loginId + password */
  registerVisitor: (name: string, loginId: string, password: string) => { ok: boolean; error?: string };
  /** RFID 등록: 이름 + rfidUid */
  registerRfidVisitor: (name: string, rfidUid: string) => { ok: boolean; error?: string };
  /** ID/PW 인증 → 해당 VisitorWallet 반환 */
  authenticateVisitor: (loginId: string, password: string) => VisitorWallet | null;
  /** RFID UID 인증 */
  authenticateByRfid: (rfidUid: string) => VisitorWallet | null;
}

const VisitorContext = createContext<VisitorContextType | undefined>(undefined);

const DEFAULT_VISITORS: VisitorWallet[] = [
  makeWallet('시스템 관리자', 'admin', 'admin1234'),
  makeWallet('이과학', 'sci001', '1234'),
  makeWallet('박과학', 'sci002', '1234'),
];

export function VisitorProvider({ children }: { children: ReactNode }) {
  const [visitors, setVisitors] = useState<VisitorWallet[]>(() => {
    const saved = loadSavedVisitors();
    let list = saved && saved.length > 0 && saved[0].loginId ? saved : DEFAULT_VISITORS;
    const hasAdmin = list.some(v => v.loginId === 'admin');
    if (!hasAdmin) {
      list = [makeWallet('시스템 관리자', 'admin', 'admin1234'), ...list];
    }
    return list;
  });
  const [activeVisitorIndex, setActiveVisitorIndex] = useState(-1);

  const addVisitor = (name: string, loginId?: string, password?: string): { ok: boolean; error?: string } => {
    if (visitors.length >= 20) return { ok: false, error: '관람객 수가 최대 한도(20명)에 달했습니다.' };
    
    if (loginId && loginId.trim()) {
      if (loginId.trim().length < 4) {
        return { ok: false, error: '아이디는 4자 이상이어야 합니다.' };
      }
      const exists = visitors.find(v => v.loginId === loginId.trim());
      if (exists) {
        return { ok: false, error: '이미 사용 중인 아이디입니다.' };
      }
    }
    
    if (password && password.trim() && password.trim().length < 4) {
      return { ok: false, error: '비밀번호는 4자 이상이어야 합니다.' };
    }

    const newWallet = makeWallet(name.trim(), loginId?.trim(), password?.trim());
    setVisitors(prev => [...prev, newWallet]);
    setActiveVisitorIndex(visitors.length);
    return { ok: true };
  };

  const updateVisitor = (index: number, name: string, loginId: string, password: string): { ok: boolean; error?: string } => {
    if (index < 0 || index >= visitors.length) {
      return { ok: false, error: '잘못된 인덱스입니다.' };
    }
    if (!name.trim() || !loginId.trim() || !password.trim()) {
      return { ok: false, error: '이름, 아이디, 비밀번호를 모두 입력해주세요.' };
    }
    if (loginId.trim().length < 4) {
      return { ok: false, error: '아이디는 4자 이상이어야 합니다.' };
    }
    if (password.trim().length < 4) {
      return { ok: false, error: '비밀번호는 4자 이상이어야 합니다.' };
    }
    const exists = visitors.find((v, idx) => v.loginId === loginId.trim() && idx !== index);
    if (exists) {
      return { ok: false, error: '이미 사용 중인 아이디입니다.' };
    }
    setVisitors(prev => {
      const list = [...prev];
      list[index] = {
        ...list[index],
        name: name.trim(),
        loginId: loginId.trim(),
        password: password.trim()
      };
      return list;
    });
    return { ok: true };
  };

  const registerVisitor = (name: string, loginId: string, password: string): { ok: boolean; error?: string } => {
    if (!name.trim() || !loginId.trim() || !password.trim()) {
      return { ok: false, error: '이름, 아이디, 비밀번호를 모두 입력하세요.' };
    }
    if (loginId.length < 4) {
      return { ok: false, error: '아이디는 4자 이상이어야 합니다.' };
    }
    if (password.length < 4) {
      return { ok: false, error: '비밀번호는 4자 이상이어야 합니다.' };
    }
    const exists = visitors.find(v => v.loginId === loginId);
    if (exists) {
      return { ok: false, error: '이미 사용 중인 아이디입니다.' };
    }
    if (visitors.length >= 20) {
      return { ok: false, error: '관람객 수가 최대 한도(20명)에 달했습니다.' };
    }
    const newWallet = makeWallet(name, loginId, password);
    setVisitors(prev => [...prev, newWallet]);
    return { ok: true };
  };

  const registerRfidVisitor = (name: string, rfidUid: string): { ok: boolean; error?: string } => {
    if (!name.trim() || !rfidUid.trim()) {
      return { ok: false, error: '이름과 RFID UID를 입력하세요.' };
    }
    const exists = visitors.find(v => v.rfidUid === rfidUid);
    if (exists) {
      return { ok: false, error: '이미 등록된 RFID 카드입니다.' };
    }
    if (visitors.length >= 20) {
      return { ok: false, error: '관람객 수가 최대 한도에 달했습니다.' };
    }
    const newWallet = makeRfidWallet(name, rfidUid);
    setVisitors(prev => [...prev, newWallet]);
    return { ok: true };
  };

  const authenticateVisitor = (loginId: string, password: string): VisitorWallet | null => {
    const visitor = visitors.find(v => v.loginId === loginId && v.password === password);
    return visitor || null;
  };

  const authenticateByRfid = (rfidUid: string): VisitorWallet | null => {
    const visitor = visitors.find(v => v.rfidUid === rfidUid);
    return visitor || null;
  };

  const activeVisitor = visitors[activeVisitorIndex] || visitors[0];

  return (
    <VisitorContext.Provider value={{
      visitors, activeVisitorIndex, activeVisitor, setActiveVisitorIndex,
      addVisitor, setVisitors,
      registerVisitor, registerRfidVisitor,
      authenticateVisitor, authenticateByRfid,
      updateVisitor,
    }}>
      {children}
    </VisitorContext.Provider>
  );
}

export function useVisitors() {
  const context = useContext(VisitorContext);
  if (!context) {
    throw new Error('useVisitors must be used within a VisitorProvider');
  }
  return context;
}

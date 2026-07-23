# 🚀 [상용 수준] 블록체인 생태계 플랫폼 아키텍처 고도화 구현 계획

본 계획서는 본 서비스를 단순 교육용 앱을 넘어 **상용 소프트웨어 수준(Production-Grade)의 아키텍처, 암호학적 보안성, 상태 관리 분리, Web Worker 채굴, 에러 바운더리 및 데이터 검증 시스템**으로 고도화하기 위한 설계 및 구현 방안입니다.

---

## User Review Required

> [!IMPORTANT]
> **1. 리액트 컨텍스트 기반 아키텍처 전환 (Global State Management)**
> 현재 `App.tsx`에 집중되어 있는 `useState`/`useRef` 및 Props Drilling 구조를 **도메인별 모듈화 컨텍스트 (`BlockchainContext`, `AuthContext`, `VisitorContext`)**로 분리하여 유지보수성 및 확장성을 상용 레벨로 끌어올립니다.

> [!IMPORTANT]
> **2. Web Worker 기반 비동기 채굴 엔진 (PoW Web Worker Engine)**
> 메인 UI 스레드에서 `setTimeout`으로 동작하는 채굴 방식을 **Web Worker (`mining.worker.ts`)**로 이전하여 난이도가 높아져도 UI 렌더링(프레임 드랍)에 영향 없이 백그라운드 멀티스레드로 해시 탐색이 수행되도록 개선합니다.

> [!NOTE]
> **3. 암호학적 서명 검증 및 세션 인증 고도화**
> - 단순 문자열 SHA-256 서명을 ECDSA (Elliptic Curve Digital Signature Algorithm) 기반의公開키/비밀키 암호화 서명 체험 엔진으로 교체.
> - 관리자 암호 검증 시 SHA-256 해시 비교 및 세션 타임아웃(Session Expiry) 보안 적용.

---

## Open Questions

> [!NOTE]
> **질문 1. Web Worker 백그라운드 채굴 적용 수준**
> 채굴 난이도를 최대 5 이상으로 설정할 수 있도록 하고, 채굴 중에도 차트 및 애니메이션이 60fps로 매끄럽게 동작하도록 Web Worker 전용 스레드 채굴을 적용할까요?

> [!NOTE]
> **질문 2. 영수증 이미지/PDF 내보내기 라이브러리 연동**
> 거래 영수증 모달에서 HTML2Canvas / SVG 기반 영수증 이미지(PNG) 저장 및 CSV 원장 다운로드 기능을 상용 모듈로 추가할까요?

---

## Proposed Changes

### 1. 상태 관리 및 도메인 모듈화 (State Management Architecture)

#### [NEW] [src/context/BlockchainContext.tsx](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/context/BlockchainContext.tsx)
- 블록체인 객체, 틱 번호, 난이도, 채굴 상태, 멤풀(Mempool) 및 블록체인 비즈니스 로직을 전역 공급하는 Provider 구현.

#### [NEW] [src/context/AuthContext.tsx](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/context/AuthContext.tsx)
- 관리자 인증 상태, 세션 만료 타임아웃, 로그인/로그아웃 보안 토큰 관리를 캡슐화한 Provider 구현.

#### [NEW] [src/context/VisitorContext.tsx](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/context/VisitorContext.tsx)
- 관람객 지갑 목록, 활성 지갑 선택, 지갑 생성 및 지속성 연동을 담당하는 전역 훅 구현.

---

### 2. 채굴 성능 최적화 및 Web Worker 백그라운드 처리 (Multi-threaded Mining)

#### [NEW] [src/workers/mining.worker.ts](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/workers/mining.worker.ts)
- Main Thread와 독립된 Web Worker 스레드에서 PoW(Proof of Work) 해시 계산 수행.
- 메인 렌더링 스레드의 블로킹 없는 매끄러운 UX 제공.

---

### 3. 암호학 보안 및 검증 강화 (Crypto & Validation Engine)

#### [MODIFY] [src/cryptoEngine.ts](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/cryptoEngine.ts)
- 키쌍 생성(PublicKey/PrivateKey), 트랜잭션 암호 서명 생성 및 타당성 검증(Signature Verification) 로직 분리 및 고도화.
- 트랜잭션 위변조 시 서명 검증 실패(Signature Invalid) 메커니즘을 시각적으로 구현.

#### [NEW] [src/components/ErrorBoundary.tsx](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/components/ErrorBoundary.tsx)
- 예기치 못한 데이터 파싱 오류나 원장 파괴 시 앱 전체 멈춤을 방지하는 React Error Boundary 구현.

---

### 4. 상용 레벨 UI/UX & 뷰어 고도화 (Commercial UI Polish)

#### [MODIFY] [App.tsx](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/App.tsx)
- 모듈화된 Context Provider 적용 및 모놀리식 구조 해제.
- 대형 모니터 및 모바일/태블릿을 위한 반응형 레이아웃 및 서브메뉴 네비게이션.

#### [MODIFY] [ExplorerTab.tsx](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/components/ExplorerTab.tsx)
- 실시간 블록 노드 체인 그래피컬 시각화(SVG / Interactive Block Streamer).
- 멤풀(Mempool) 미확인 트랜잭션 대기열 실시간 모니터.

#### [MODIFY] [TransactionReceipt.tsx](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/components/TransactionReceipt.tsx)
- 영수증 이미지(PNG) 다운로드 및 클릭 시 클립보드 자동 복사 기능 강화.

---

## Verification Plan

### Automated Tests
- Build & Type Validation:
  ```powershell
  npm run build
  ```
- Linting & Formatter Check:
  ```powershell
  npx eslint src --ext ts,tsx
  ```

### Manual Verification
1. **아키텍처 모듈화 검증**:
   - `BlockchainContext`, `AuthContext`, `VisitorContext` 상태 변경 시 앱 내 모든 탭에 실시간 동기화 확인.
2. **Web Worker 채굴 검증**:
   - 채굴 난이도를 3~4로 상향 후 마이닝 실행 시 UI 애니메이션 및 반응속도가 끊김(Lag) 없이 유지되는지 확인.
3. **암호 서명 위변조 테스트**:
   - 탐색기에서 트랜잭션 금액 변경 시 디지털 서명 검증(`isValid()`)이 즉시 `False`로 판정되고 원장 경고가 발생하는지 검증.

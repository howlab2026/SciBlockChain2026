# [기획/구현/화면구분] 과학제전 블록체인 체험 플랫폼 종합 개선 구현 계획

본 서비스는 과학제전/체험 부스에서 사용자가 블록체인 결제 및 원장 작동 원리를 직접 체험하고, 관리자가 토큰 정책 설정 및 블록체인 관제를 수행할 수 있는 웹 기반 플랫폼입니다.

전체 코드베이스(`App.tsx`, `blockchain.ts`, `AdminTab.tsx`, `WalletTab.tsx`, `BoothTab.tsx`, `ExplorerTab.tsx`, `AnalyticsTab.tsx` 등)를 분석한 결과, 서비스의 완결성과 UX, 관리자/사용자 역할 분리를 극대화하기 위한 종합 개선 계획을 수립하였습니다.

---

## User Review Required

> [!IMPORTANT]
> **화면상 관람객(일반 사용자) vs 관리자(Admin) UI/UX 명확한 분리**
> 현재 모드 전환 시 탭 구성만 약간 변하고 전체 테마 및 헤더 스타일이 유사하여, 사용자가 현재 '관람객 모드'인지 '관리자 모드'인지 직관적으로 구분하기 어렵습니다.
> - **관람객 모드**: 블루/사이언 톤의 깔끔한 체험용 UI, 결제 및 지갑 중심 3개 탭 구성.
> - **관리자 모드**: 엠버/퍼플 톤의 어드민 관제 UI, 관리자 뱃지 강조, 코인 민팅/위변조 검증/부스 정산 포함 5개 탭 구성.

> [!NOTE]
> **데이터 지속성(localStorage) 적용**
> 현재 새로고침 시 발행한 코인, 생성된 지갑, 결제 트랜잭션, 부스 설정이 모두 리셋되는 문제가 있습니다. 브라우저 `localStorage` 기반 자동 저장 및 초기화 옵션을 추가합니다.

---

## Open Questions

> [!NOTE]
> **질문 1. 관람객 P2P 송금 기능 확장**
> 관람객 지갑 간 직접 코인을 송금(P2P Transfer)할 수 있는 드롭다운 선택 방식 기능을 관람객 지갑 탭에 추가할까요?

> [!NOTE]
> **질문 2. 영수증 이미지/JSON 저장 기능**
> 결제 및 거래 영수증 팝업에서 영수증을 이미지(PNG) 또는 텍스트로 즉시 다운로드받는 기능을 포함할까요?

---

## Proposed Changes

### 1. 역할별 화면 UI/UX 및 테마 완전 분리 (Visual Role Separation)

#### [MODIFY] [App.tsx](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/App.tsx)
- 헤더 및 메인 래퍼에 모드별 테마 스타일 클래스 (`mode-visitor`, `mode-admin`) 적용.
- 헤더에 상시 노출되는 역할 뱃지 강화 (`👤 관람객 체험 모드` vs `🛡️ 시스템 관리자 어드민 모드`).
- 관람객 전용 탭(`wallet`, `booth`, `explorer`)과 관리자 전용 탭(`settings`, `admin-wallets`, `admin-booths`, `explorer`, `analytics`) 구분 및 레이아웃 커스텀화.
- 모드 전환 시 안내 팝업 및 안내 스낵바 강화.

#### [MODIFY] [index.css](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/index.css)
- Admin 모드 전용 고급 엠버/글로우 디자인 토큰 추가.
- Visitor 모드 전용 사이언/인디고 청량한 디자인 토큰 추가.
- 역할별 탭 바 및 액션 버튼의 시각적 명암/그라데이션 차별화.

---

### 2. 데이터 지속성 및 스토리지 연동 (Persistence Layer)

#### [NEW] [useBlockchainPersistence.ts](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/hooks/useBlockchainPersistence.ts)
- `Blockchain` 객체, `visitors` 목록, `booths` 목록, `processedTxIds` 상태를 `localStorage`에 자동 동기화.
- 앱 로드 시 기존 데이터를 안전하게復元(Hydrate)하고, 파싱 실패 시 기본 데이터로 복구하는 폴백 로직 작성.

---

### 3. 관람객 지갑 및 부스 결제 UX 개선 (Visitor & Booth Experience)

#### [MODIFY] [WalletTab.tsx](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/components/WalletTab.tsx)
- 관람객 간 직접 송금(P2P)을 위한 관람객 지갑 선택 드롭다운 UI 추가.
- QR 코드 가상 스캐너 체험 모달 연결 (부스 QR 스캔 후 바로 결제 실행).
- 지갑 잔액 충전(카드 결제) 및 전송 이력 필터링 기능 강화.

#### [MODIFY] [BoothTab.tsx](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/components/BoothTab.tsx)
- 관리자 모드 및 부스 운영자 모드에서 부스 가격 수정, 부스 일시정지, 부스 매출 환불(Refund) 기능 추가.
- QR 결제 대기 상태 및 결제 완료 애니메이션 시각적 피드백 향상.

---

### 4. 어드민 관제 및 원장 위변조 검증 체험 강화 (Admin Portal & Ledger Audit)

#### [MODIFY] [AdminTab.tsx](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/components/AdminTab.tsx)
- 신규 코인 민팅 폼 개선: 코인 심볼, 유효기간, 발행량 설정 UI 직관화 및 유효성 검사 강화.
- 시스템 전체 데이터 백업(JSON 다운로드) 및 복원(JSON 업로드) 기능 추가.
- 관리자 전용 일괄 코인 지급(에어드랍 체험) 기능 추가.

#### [MODIFY] [ExplorerTab.tsx](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/components/ExplorerTab.tsx)
- 블록 데이터 위변조(Tampering) 및 51% 공격 / 복구 마이닝 체험의 단계별 시각화 강화 (정상 green -> 위변조 red warning -> re-mine blue progress).

#### [MODIFY] [TransactionReceipt.tsx](file:///c:/Work/AntiGravity/SciBlockChain_20260722/src/components/TransactionReceipt.tsx)
- 영수증 복사 및 텍스트/이미지 캡처 보조 기능 추가.

---

## Verification Plan

### Automated Tests
- Build & TypeScript Type Checking:
  ```powershell
  npm run build
  ```
- ESLint checks:
  ```powershell
  npx eslint src --ext ts,tsx
  ```

### Manual Verification
1. **일반 사용자(관람객) 모드 시나리오**:
   - 지갑 생성 -> 카드 결제로 코인 충전 -> 체험 부스 원클릭/QR 결제 -> 잔액 및 영수증 확인 -> P2P 송금 동작 확인.
2. **관리자(Admin) 모드 시나리오**:
   - 관리자 로그인 (`admin1234`) -> Admin 전용 엠버 테마 전환 확인 -> 신규 코인 민팅 (`SciCoin2026`) -> 블록체인 원장 초기화 -> 탐색기에서 데이터 위변조 체험 및 복구 채굴 검증 -> JSON 원장 엑스포트 확인.
3. **지속성 검증**:
   - 코인 충전 및 결제 진행 후 브라우저 새로고침 -> 이전 지갑 잔액, 블록체인 원장, 결제 영수증 데이터 유지 확인.

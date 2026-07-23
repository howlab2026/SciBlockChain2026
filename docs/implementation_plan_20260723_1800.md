# 과학제전 블록체인 결제 시뮬레이션 시스템 (SciBlockChain v2.0) 종합 아키텍처 및 구현 사양서

## 📌 1. 프로젝트 개요
**SciBlockChain v2.0**은 과학전람회 및 과학제전 행사에서 관람객이 가상 카드 결제로 행사용 암호화폐를 충전하고, 각 체험 부스에서 QR 코드로 결제하는 과정을 실시간으로 체험할 수 있는 교육용 블록체인 결제 시뮬레이션 플랫폼입니다.

---

## 🏗️ 2. 시스템 아키텍처 및 기술 스택

### 2.1 프론트엔드 스택
- **Core**: React 19, TypeScript, Vite
- **Iconography & Visuals**: `lucide-react`, `canvas-confetti`, SVG 기반 커스텀 렌더러
- **Styling**: Vanilla CSS3 + Soft Pastel Light Theme (Flat Bright Pastel 디자인)

### 2.2 모듈화 파일 구조
```
src/
├── blockchain.ts                # SHA-256 기반 블록체인 코어 엔진 (Transaction, Block, Blockchain)
├── types.ts                     # 공유 도메인 타입 (Booth, VisitorWallet, ReceiptData)
├── main.tsx                     # React 진입점
├── App.tsx                      # 메인 오케스트레이터 컴포넌트
├── index.css                    # 소프트 파스텔 디자인 시스템 및 유틸리티 클래스
├── hooks/
│   ├── useBlockchain.ts         # 블록체인 상태, 마이닝 로직, 파생 지포 훅
│   └── useToast.ts              # 비차단형 알림 제어 훅
└── components/
    ├── LandingScreen.tsx        # 첫화면 포털 (역할 선택 & 네트워크 프리뷰)
    ├── AdminLoginModal.tsx      # 관리자 ID/PW 승인 로그인 모달
    ├── NetworkStatsBar.tsx      # 실시간 지표 상단 상태 바
    ├── Toast.tsx                # 슬라이드 알림 컴포넌트
    ├── CardPaymentModal.tsx     # 가상 카드 결제 모달
    ├── TransactionReceipt.tsx   # 암호학 영수증 & 인쇄 모달
    ├── VisualQRCode.tsx         # SVG QR 코드 생성기
    ├── WalletTab.tsx            # [1] 관람객 지갑 & 카드 충전 & 송금 & 정보 관리
    ├── BoothTab.tsx             # [2] 체험 부스 관리 & 결제 모니터링
    ├── ExplorerTab.tsx          # [3] 블록 탐색기 & 검색 & 위변조 실습
    ├── AnalyticsTab.tsx         # [4] SVG 데이터 분석 대시보드 & JSON 내보내기
    └── AdminTab.tsx             # [5] 신규 토큰 민팅 & 어드민 관제 센터
```

---

## 🔐 3. 역할 기반 접근 제어 (RBAC) 및 보안 모델

### 3.1 관람객 모드 (Visitor View)
- 진입 시 4개 핵심 탭 제공: `[관람객 지갑]`, `[체험 부스]`, `[블록 탐색기]`, `[분석 대시보드]`
- **간소화된 UX**: 불필요한 '빠른 부스 결제' 버튼이 제거되어 지갑 충전에 집중할 수 있습니다.
- **로그아웃 경험**: 상단 로그아웃 버튼을 누르면 로그인 화면이 아닌 포털 **처음화면(Landing)**으로 즉시 돌아갑니다.
- 토큰 민팅, 작업증명 난이도 변경, 원장 초기화 등 민감한 제어 메뉴는 차단됩니다.

### 3.2 시스템 관리자 모드 (Admin Authorized View)
- ID (`admin`) / PW (`admin1234`) 승인 필요
- 승인 완료 시 5대 관제 메뉴 및 상단 황금빛 **[신규 코인 발행 & 스마트 계약 구동]** 패널 전면 노출
- 토큰 심볼 명칭, 유효기간, 제네시스 총 공급량 설정 및 원장 스마트 계약 배포 권한 부여
- **지갑 추가 시 계정 정보 설정**: 신규 지갑 생성 시 이름뿐만 아니라 로그인 ID 및 비밀번호를 관리자가 직접 세팅할 수 있습니다.
- **관람객 정보 수정**: 등록된 관람객 리스트 테이블에서 언제든지 이름, ID, 비밀번호를 테이블 내 인라인 폼을 통해 수정할 수 있습니다. (아이디 중복 검사 및 유효성 검증 제공)

---

## 🎨 4. 디자인 시스템 사양 (Flat Bright Pastel Theme)

- **배경**: 라벤더, 스카이블루, 핑크 아우라 미세 아우라 단색 플랫 파스텔 (`#f1f5f9`)
- **컨테이너**: 소프트 화이트 글래스모피즘 (`rgba(255, 255, 255, 0.88)` + Blur 20px)
- **타이포그래피**: Outfit & JetBrains Mono, 슬레이트 텍스트 (`#1e293b`, `#0f172a`)
- **버튼**: 파스텔 라벤더, 인디고, 민트, 피치 필 버튼 (그라데이션 제거)

---

## 🚀 5. 배포 사양 (Deployment Specifications)

- **Git Repository**: [https://github.com/howlab2026/SciBlockChain2026](https://github.com/howlab2026/SciBlockChain2026)
- **Vercel Config**: `vercel.json` (Vite SPA rewriting enabled)
- **Vercel Live URL**: [https://sci-block-chain2026.vercel.app](https://sci-block-chain2026.vercel.app)
- **Verification Commands**: `npx tsc --noEmit` & `npm run build` (0 Errors)

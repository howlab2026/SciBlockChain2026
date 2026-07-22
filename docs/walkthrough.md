# SciBlockChain v2.0 — 종합 개발 및 구현 완료 보고서 (Walkthrough)

과학전람회 및 과학제전 행사에서 관람객이 가상 카드 결제로 행사용 코인을 충전하고 각 체험 부스에서 QR 코드로 결제하는 과정을 시뮬레이션하는 **과학제전 블록체인 결제 플랫폼 (SciBlockChain v2.0)** 구축을 완료하였습니다.

---

## 🌟 주요 시스템 구성 및 핵심 기능

### 1. 🚀 포털 첫화면 (Landing Screen) & 역할 분리
- **포털 첫화면**: [LandingScreen.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/LandingScreen.tsx)
- **2대 역할 선택 카드**:
  1. 🎓 **관람객 & 부스 체험 모드 (General User Mode)**: 지갑 충전, 부스 결제, 블록 탐색기 및 데이터 분석 대시보드 이용
  2. 🛡️ **시스템 관리자 모드 (Admin Authorized Mode)**: 관리자 승인 로그인을 거쳐 어드민 관제 센터로 진입
- **실시간 네트워크 현황 프리뷰**: 총 블록 수, 활성 토큰, 총 거래 건수 요약 제공

### 2. 🔐 관리자 승인 로그인 시스템 (Admin Auth)
- **로그인 모달**: [AdminLoginModal.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/AdminLoginModal.tsx)
- **기본 계정**: ID `admin` / PW `admin1234`
- **테스트용 원클릭 자동 입력** 기능 제공

### 3. 🪙 신규 코인 발행 전면 패널 (Coin Issuance & Minting)
- **어드민 관제 센터 최상단 전면 배치**: [AdminTab.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/AdminTab.tsx)
- **원클릭 토큰 템플릿 프리셋**:
  - `SciBlockChain`: 과학제전 행사용 표준 블록체인 토큰 (1,000,000개)
  - `SciEduToken`: 학생 교육 및 실험 포인트 전용 코인 (500,000개)
  - `FestivalCoin`: 체험 부스 통합 결제 페스티벌 코인 (2,000,000개)
- **스마트 계약 구동**: 토큰 심볼, 유효기간, 제네시스 공급량을 설정하여 신규 암호화폐 민팅 및 제네시스 블록 생성

### 4. 🎨 소프트 파스텔 톤 디자인 시스템 (Soft Pastel Light Theme)
- **배경**: 소프트 파스텔 아우라 그래디언트 (`#f1f5f9`)
- **글래스 카드**: 반투명 화이트 글래스모피즘 (`rgba(255, 255, 255, 0.88)` + Blur 20px)
- **가독성**: 슬레이트 고대비 타이포그래피 (`#1e293b`, `#0f172a`)

### 5. 📊 데이터 분석 대시보드 (Analytics Tab)
- KPI 카드로 총 거래량, 총 TX 수, 마이닝 보상액, 인기 부스 시각화
- SVG 기반 부스별 수익 막대 차트 & 거래 유형 도넛 차트
- JSON 원장 파일 다운로드(Export) 기능 연동

---

## 🏗️ 모듈화 파일 구성표

| 구 분 | 파 일 | 역 할 |
|-------|-------|-------|
| **블록체인 코어** | [blockchain.ts](file:///c:/Work/AntiGravity/BlockChainEco_001/src/blockchain.ts) | SHA-256 트랜잭션, 작업증명(PoW), 무결성 검증, 원장 통계 |
| **공유 타입** | [types.ts](file:///c:/Work/AntiGravity/BlockChainEco_001/src/types.ts) | Booth, VisitorWallet, ReceiptData 인터페이스 |
| **커스텀 훅** | [useBlockchain.ts](file:///c:/Work/AntiGravity/BlockChainEco_001/src/hooks/useBlockchain.ts) | 전역 블록체인 상태 및 채굴 관리 |
| | [useToast.ts](file:///c:/Work/AntiGravity/BlockChainEco_001/src/hooks/useToast.ts) | 비차단 슬라이드 토스트 알림 |
| **첫화면 & 인증** | [LandingScreen.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/LandingScreen.tsx) | 진입 포털 화면 |
| | [AdminLoginModal.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/AdminLoginModal.tsx) | ID/PW 인증 모달 |
| **UI 모듈** | [NetworkStatsBar.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/NetworkStatsBar.tsx) | 네트워크 지표 상단 바 |
| | [CardPaymentModal.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/CardPaymentModal.tsx) | 가상 카드 결제 모달 |
| | [TransactionReceipt.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/TransactionReceipt.tsx) | 암호학 결제 영수증 & 인쇄 |
| | [VisualQRCode.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/VisualQRCode.tsx) | SVG QR 코드 생성기 |
| **5대 메인 탭** | [WalletTab.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/WalletTab.tsx) | 관람객 다중 지갑 & 송금 |
| | [BoothTab.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/BoothTab.tsx) | 부스 관리 & QR 결제 |
| | [ExplorerTab.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/ExplorerTab.tsx) | 원장 탐색 & 위변조 실습 |
| | [AnalyticsTab.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/AnalyticsTab.tsx) | SVG 데이터 분석 대시보드 |
| | [AdminTab.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/components/AdminTab.tsx) | 신규 토큰 민팅 & 어드민 관제 센터 |
| **배포 설정** | [vercel.json](file:///c:/Work/AntiGravity/BlockChainEco_001/vercel.json) | Vercel SPA 웹 라우팅 설정 |

---

## 🌐 원격 저장소 및 라이브 배포 정보

- **GitHub 저장소**: [https://github.com/howlab2026/SciBlockChain2026](https://github.com/howlab2026/SciBlockChain2026)
- **Vercel 라이브 서비스**: [https://sci-block-chain2026.vercel.app](https://sci-block-chain2026.vercel.app)
- **TypeScript strict check**: `npx tsc --noEmit` (**0 Errors**)
- **Production Build**: `npm run build` (**726ms 빌드 완료**)

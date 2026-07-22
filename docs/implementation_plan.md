# 과학제전 블록체인 코인 결제 시스템 (SciBlockChain) 구현 계획서

이 프로젝트는 과학제전과 같은 대형 행사에서 관람객이 카드 결제를 통해 행사용 코인(SciBlockChain)을 충전하고, 이를 사용하여 각 체험 부스에서 부스 실험/체험 요금을 간편하게 결제할 수 있는 블록체인 기반 결제 시스템을 개발하는 것입니다.

사용자가 블록체인의 작동 원리를 시각적으로 이해하고, 실제 카드 결제 및 부스 결제 흐름을 완벽하게 시뮬레이션할 수 있도록 **고급 디자인(Glassmorphism, Neon/Dark 테마, 마이크로 인터랙션)을 적용한 웹 애플리케이션**으로 구축합니다.

---

## User Review Required

> [!IMPORTANT]
> 1. **시뮬레이션 vs 실제 블록체인 네트워크**:
>    - 본 데모 및 운영 프로토타입은 브라우저 환경에서 실시간으로 블록 생성, 마이닝, 해시 검증을 시각적으로 보여주는 **자체 구현 블록체인 엔진(SHA-256 기반)**을 탑재하여 별도의 지갑(Metamask 등)이나 가스비 부담 없이 직관적인 체험을 제공하도록 설계했습니다. 
>    - 만약 실제 테스트넷(Polygon, Ethereum Goerli 등)이나 프라이빗 메인넷(Hyperledger, Besu 등) 연동이 필수적인지 확인이 필요합니다. (기본 제안: 웹 기반 시각화 시뮬레이터가 포함된 독립 시스템)
>
> 2. **카드 결제 모의(Mocking)**:
>    - 실제 토스페이먼츠나 아임포트(Portone) 등 결제 PG사를 연동할 수도 있으나, 사업자 등록 및 가맹점 심사가 필요하므로 본 프로토타입에서는 **PG사 결제창을 시각적으로 완벽하게 모사한 카드 결제 시뮬레이션 모듈**을 내장하여 충전 흐름을 구현합니다.

---

## Open Questions

> [!NOTE]
> - **체험 방식**: 관람객이 스마트폰(모바일 웹)으로 접속하여 본인 지갑을 사용하고, 부스는 태블릿/PC로 결제 QR을 띄우는 구조가 일반적입니다. 이를 하나의 화면에서 손쉽게 전환하며 테스트할 수 있도록 **"관람객(Visitor) 모드"**, **"부스(Booth) 모드"**, **"블록체인 익스플로러 & 어드민"** 세 가지 뷰를 탭 형태로 제공하는 형태로 개발하고자 합니다. 이에 대해 의견이 있으신가요?

---

## Proposed Changes

프로젝트는 React + TypeScript + Vite 기반의 고품격 웹 앱으로 구성하며, 단일 페이지 애플리케이션(SPA) 내에서 다이내믹한 뷰 전환과 실시간 상태 관리(블록체인 원장, 지갑 잔액, 부스 목록)를 지원합니다.

### 1. Core Blockchain Engine

자체 구현된 Javascript 기반의 경량 블록체인 엔진입니다.
- **Transaction**: 송금인, 수취인, 금액, 타임스탬프, 디지털 서명(SHA-256 기반 모의 서명)
- **Block**: 블록 인덱스, 타임스탬프, 트랜잭션 목록, 이전 블록 해시, 현재 블록 해시, Nonce, 난이도(Difficulty)
- **Blockchain**: 블록 체인 검증, 작업 증명(PoW) 마이닝 알고리즘, 지갑 주소별 잔고 조회, 대기 중인 트랜잭션 풀(Mempool)

### 2. UI / UX Design System (Vibrant Space/Neon Dark theme)
- **색상 팔레트**: Deep Navy background (`#0b0f19`), Glowing Blue (`#3b82f6`), Emerald Green (`#10b981`), Neon Violet (`#8b5cf6`), Cyberpunk Yellow (`#fbbf24`)
- **Glassmorphism**: 반투명 카드 레이아웃 (`backdrop-filter: blur(16px)`), 미세한 테두리 그라디언트
- **Typography**: `Outfit` 또는 `Inter` 구글 폰트를 활용한 현대적 감각의 서체
- **Animations**: 블록 마이닝 시 회전 및 펄스 이펙트, 결제 성공 시 체크마크 페이드인, 탭 전환 시 부드러운 슬라이드

---

### File Structure & Setup

#### [NEW] [index.html](file:///c:/Work/AntiGravity/BlockChainEco_001/index.html)
어플리케이션의 메인 진입점입니다. 웹 폰트(Outfit) 및 기본 메타데이터, 모바일 뷰포트 대응 디자인을 설정합니다.

#### [NEW] [src/blockchain.ts](file:///c:/Work/AntiGravity/BlockChainEco_001/src/blockchain.ts)
블록체인 코어 엔진 코드로, `Block`, `Transaction`, `Blockchain` 클래스를 정의하고 실시간 채굴 및 검증 로직을 담습니다.

#### [NEW] [src/App.tsx](file:///c:/Work/AntiGravity/BlockChainEco_001/src/App.tsx)
메인 어플리케이션 컴포넌트로, 세 가지 핵심 뷰를 상태로 관리하고 전체적인 레이아웃을 제공합니다.
- **Wallet/Visitor Tab**: 카드 결제 시뮬레이션, 지갑 생성, 코인 잔액 조회, QR 스캔/결제 전송
- **Booth Tab**: 부스 생성 및 관리, 상품/실험 목록, 금액 입력 및 QR 코드 생성, 실시간 결제 완료 대기 화면
- **Explorer Tab**: 블록체인 시각화 그래프, 블록 세부 정보 조회, 대기 트랜잭션(Mempool) 현황, 블록 해시 검증 도구

#### [NEW] [src/index.css](file:///c:/Work/AntiGravity/BlockChainEco_001/src/index.css)
글로벌 CSS 파일로 Glassmorphism 스타일, 그라디언트 테두리, 다크 테마 배경 및 애니메이션 키프레임을 정의합니다.

---

## Verification Plan

### Manual Verification
1. **관람객 모드 테스트**:
   - 가상 카드 정보 입력하여 10,000원 카드 결제 진행 -> 100 SciBlockChain 충전 확인 (블록체인에 충전 트랜잭션 추가 및 마이닝 진행 시각화).
   - 생성된 지갑 주소 확인 및 복사.
2. **부스 모드 테스트**:
   - 신규 부스 등록 (예: "액체질소 아이스크림 만들기", 참가비: 15 SciBlockChain).
   - 해당 부스에서 결제 QR 생성.
3. **결제 시뮬레이션**:
   - 관람객이 부스의 QR을 스캔(또는 부스 결제 코드 입력)하여 결제 요청 -> 비밀번호/서명 입력 -> 트랜잭션 전송.
   - 블록체인 익스플로러에서 대기 트랜잭션 풀에 들어간 후, 자동으로 마이닝되어 블록이 생성되는 시각 효과 확인.
   - 결제 완료 시 부스 화면이 "결제 완료! 실험을 시작하세요"로 자동 전환되는지 확인.
   - 관람객 잔액이 차감되고 부스 잔액이 증가했는지 확인.
4. **블록체인 검증**:
   - 블록체인의 원장이 손상되지 않았는지 실시간 무결성 검사 상태("Valid Chain")를 UI에 표시.

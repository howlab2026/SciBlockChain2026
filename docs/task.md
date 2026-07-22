# SciBlockChain 개발 체크리스트

- [x] 프로젝트 초기화 및 환경 설정
  - [x] `npm` 및 `vite` 프로젝트 생성
  - [x] 필요한 라이브러리 설치 (예: lucide-react, canvas-confetti 등)
- [x] 블록체인 코어 엔진 개발 (`src/blockchain.ts`)
  - [x] `Transaction` 클래스 및 디지털 서명 모사 구현
  - [x] `Block` 클래스 및 작업 증명(PoW) 마이닝 로직 구현
  - [x] `Blockchain` 클래스 (체인 무결성 검증, 멤풀, 잔액 계산 등) 구현
- [x] UI 스타일링 및 디자인 시스템 적용 (`src/index.css`)
  - [x] Space/Neon 다크 테마 배경 및 애니메이션 효과 설정
  - [x] Glassmorphism 카드 및 버튼 스타일링 구성
- [x] 메인 어플리케이션 개발 (`src/App.tsx` 등)
  - [x] 전역 블록체인 및 상태 관리 설정
  - [x] **관람객 뷰(Visitor Mode)**: 가상 지갑 생성, 모의 카드 결제 및 SciBlockChain 충전, 송금/QR 결제 기능
  - [x] **부스 뷰(Booth Mode)**: 부스 등록 및 체험비 설정, 결제용 QR 코드 생성, 실시간 결제 완료 이벤트 리스닝
  - [x] **익스플로러 뷰(Explorer Mode)**: 실시간 블록 체인 연결 그래프, 블록 채굴 프로세스 모니터링 및 무결성 검사
- [x] 검증 및 폴리싱
  - [x] 카드 결제 -> 코인 충전 -> 부스 결제 -> 채굴 -> 원장 반영 시나리오 테스트
  - [x] 모바일 반응형 디자인 점검 및 웹 비디오 녹화/스크린샷 생성

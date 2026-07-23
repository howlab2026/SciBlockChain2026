# ⚡ SciBlockChain 2026 — 과학제전 블록체인 결제 플랫폼 v2.0

> **과학전람회 및 과학제전 행사용 교육용 블록체인 부스 결제 & 암호화폐 체험 플랫폼**

[![Vercel Deployment](https://img.shields.io/badge/Vercel-sci--block--chain2026.vercel.app-000000?style=for-the-badge&logo=vercel)](https://sci-block-chain2026.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-SciBlockChain2026-181717?style=for-the-badge&logo=github)](https://github.com/howlab2026/SciBlockChain2026)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 📖 개요

**SciBlockChain**은 학생 및 일반 관람객이 가상 카드 결제로 행사용 코인을 충전하고, 체험 부스에서 QR 코드로 결제하는 전체 과정을 실시간 암호학 원장으로 직접 작동하고 체험할 수 있는 웹 기반 교육용 블록체인 애플리케이션입니다.

---

## ✨ 핵심 기능 (Key Features)

- 🚀 **첫화면 포털 & 역할 분리**: 관람객 모드(General User Mode)와 시스템 관리자 관제 센터(Admin Authorized Mode) 완벽 차별화
- 🔑 **관리자 ID/PW 승인 모달**: `admin` / `admin1234` 승인을 거친 관리자만 민감한 원장 제어 권한 획득
- 🪙 **신규 코인 민팅 패널 (Coin Issuance)**: 어드민 화면 최상단 원클릭 템플릿 (`SciBlockChain`, `SciEduToken`, `FestivalCoin`) 및 제네시스 블록 생성
- 💳 **가상 카드 결제 (PG 모사)**: 카드 결제를 통해 관람객 지갑 잔액 충전 체험
- 🎪 **체험 부스 QR 결제**: 부스별 QR 코드 생성 및 실시간 결제 완료 수신 모니터링
- ⛏️ **작업 증명 (PoW) 마이닝**: 난이도(Difficulty) 조절, 블록 채굴, 멤풀(Mempool) 대기 및 무결성 검증
- 📊 **SVG 데이터 분석 대시보드**: 거래량, 부스별 수익 막대 차트, 거래 유형 도넛 차트, JSON 원장 내보내기
- 🌸 **소프트 파스텔 디자인 시스템**: 눈이 편안하고 세련된 Soft Pastel Light Glassmorphism UI

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React 19, TypeScript, Vite
- **UI/UX**: Vanilla CSS3, Soft Pastel Glassmorphism, Lucide Icons, Canvas Confetti
- **Engine**: SHA-256 동기식 암호학 엔진 내장 (`src/blockchain.ts`)

---

## 🚀 로컬 실행 방법 (Local Development)

```bash
# 1. 저장소 클론
git clone https://github.com/howlab2026/SciBlockChain2026.git
cd SciBlockChain2026

# 2. 패키지 설치
npm install

# 3. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173/` 접속하여 확인합니다.

---

## 🌐 라이브 배포 및 저장소

- **GitHub 저장소**: [https://github.com/howlab2026/SciBlockChain2026](https://github.com/howlab2026/SciBlockChain2026)
- **Vercel 라이브 서비스**: [https://sci-block-chain2026.vercel.app](https://sci-block-chain2026.vercel.app)

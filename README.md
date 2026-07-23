# ⚡ SciBlockChain 2026 — 과학제전 블록체인 결제 플랫폼 v2.0

> **과학전람회 및 과학제전 행사용 교육용 블록체인 부스 결제 & 암호화폐 체험 플랫폼**

[![Vercel Deployment](https://img.shields.io/badge/Vercel-sci--block--chain2026.vercel.app-000000?style=for-the-badge&logo=vercel)](https://sci-block-chain2026.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-SciBlockChain2026-181717?style=for-the-badge&logo=github)](https://github.com/howlab2026/SciBlockChain2026)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 📖 개요

**SciBlockChain**은 학생 및 일반 관람객이 카드 결제로 행사용 코인을 충전하고, 체험 부스에서 QR 코드로 결제하는 전체 과정을 실시간 암호학 원장으로 직접 작동하고 체험할 수 있는 웹 기반 교육용 블록체인 애플리케이션입니다.

---

## ✨ 핵심 기능 (Key Features)

| 기능 | 설명 |
|------|------|
| 🚀 **첫화면 포털 & 역할 분리** | 관람객 모드와 관리자 관제 센터를 완벽하게 분리 |
| 🔑 **관리자 승인 로그인** | ID/PW 인증(`admin` / `admin1234`)을 거쳐야 원장 제어 권한 획득 |
| 🪙 **신규 코인 민팅** | 원클릭 템플릿(`SciBlockChain`, `SciEduToken`, `FestivalCoin`)으로 제네시스 블록 생성 |
| 👤 **관람객 지갑 관리** | 지갑 생성 시 ID/PW 지정 가능, 테이블 인라인 수정 지원 |
| 🪪 **관람객 셀프 로그인 · 회원가입 · RFID 태깅** | 관람객이 직접 ID/PW로 로그인하거나 신규 계정을 등록, RFID 카드를 태깅해 자동 로그인 가능 |
| 🔐 **실제 암호화 라이브러리 기반 서명** | `crypto-js`(SHA-256) + `elliptic`(ECDSA secp256k1)로 지갑 키 생성·거래 서명·검증 |
| 💳 **가상 카드 충전** | PG사를 모사한 카드 결제로 지갑 잔액 충전 |
| 🎪 **부스 QR 결제** | 부스별 QR 코드 생성 및 실시간 결제 모니터링 |
| ⛏️ **PoW 마이닝** | 난이도 조절, 블록 채굴, 멤풀 대기 및 무결성 검증 |
| 🔍 **블록 탐색기 & 위변조 실습** | 트랜잭션 데이터 조작 → 체인 무결성 파괴 → 재채굴 복원 체험 |
| 📊 **분석 대시보드** | SVG 막대/도넛 차트, KPI 카드, JSON 원장 내보내기 |
| 💾 **원장 영속 저장** | LocalStorage 기반 자동 저장·복원 및 JSON 직렬화/역직렬화 |

---

## 🧠 블록체인 핵심 기술 상세 해설

이 프로젝트는 블록체인의 작동 원리를 코드 레벨에서 직접 구현하여 교육과 체험에 활용합니다. 아래는 실제 구현된 각 기술 요소에 대한 상세한 설명입니다.

---

### 1. 🔒 SHA-256 암호학적 해시 함수 — `crypto-js` 라이브러리 기반

> 📄 구현 코드: `src/cryptoEngine.ts` — `sha256()` (16~18행), `src/blockchain.ts`가 이를 재사용

블록체인에서 가장 핵심이 되는 기반 기술은 **암호학적 해시 함수**입니다. 이전 버전은 SHA-256을 순수 TypeScript로 직접 구현했지만, 현재는 검증된 암호화 라이브러리인 **[`crypto-js`](https://www.npmjs.com/package/crypto-js)의 `SHA256`**을 사용하도록 교체했습니다.

```typescript
import CryptoJS from 'crypto-js';

export function sha256(input: string): string {
  return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
}
```

- **왜 라이브러리로 교체했는가**: 직접 구현한 해시 함수는 교육적으로는 SHA-256의 내부 동작(메시지 패딩, 라운드 상수, 압축 함수 등)을 보여주는 데 유용하지만, 실제 운영 환경의 암호화 라이브러리처럼 광범위하게 검증·테스트되지 않아 미묘한 버그의 위험이 있습니다. `crypto-js`는 수년간 커뮤니티에서 검증된 구현체로, 표준 SHA-256 출력(256비트/64자리 16진수 다이제스트)을 보장합니다.
- **유니코드(한글) 대응**: `crypto-js`의 `SHA256()`은 내부적으로 UTF-8 인코딩을 처리하므로, 한글로 된 관람객 이름이나 거래 목적(`부스 체험 결제: 로봇 코딩 부스`)이 입력에 포함되어도 정확한 해시가 산출됩니다.
- **사용처**: 블록 해시(`Block.calculateHash()`), 트랜잭션 ID(`Transaction.calculateHash()`), 지갑 주소 파생(`addressFromPublicKey()`), ECDSA 서명 전 메시지 다이제스트 생성 등 프로젝트 전반의 해시 연산에 이 함수 하나로 통일되어 있습니다.

---

### 2. 📝 트랜잭션 (Transaction) — 거래의 최소 단위

> 📄 구현 코드: `src/blockchain.ts` — `Transaction` 클래스 (23~82행)

모든 거래(코인 충전, 부스 결제, 송금 등)는 `Transaction` 객체로 표현됩니다.

#### 트랜잭션 데이터 구조

```typescript
interface ITransaction {
  id: string;           // SHA-256(from + to + amount + purpose + timestamp)
  fromAddress: string;   // 송금자 지갑 주소 (예: "0xVisitor_a1b2c3d4")
  toAddress: string;     // 수신자 주소 (예: 부스 ID "BOOTH_ROBOT")
  amount: number;        // 거래 금액 (코인 단위)
  timestamp: number;     // Unix 타임스탬프 (밀리초)
  purpose: string;       // 거래 목적 (예: "부스 체험 결제: 로봇 코딩 부스")
  signature: string;     // ECDSA(secp256k1) 디지털 서명 (DER, hex)
  publicKey: string;     // 서명 검증용 송금자 공개키 (hex, uncompressed)
}
```

`publicKey` 필드는 이번 개편에서 새로 추가되었습니다. 실제 전자서명(ECDSA)을 검증하려면 서명자의 공개키가 필요하기 때문에, 트랜잭션에 서명 시점의 공개키를 함께 실어 보내고, 검증 시 이 공개키로부터 유도한 주소가 `fromAddress`와 일치하는지도 함께 확인합니다.

#### 트랜잭션 고유 ID(TXID) 생성 방식

트랜잭션의 5개 필드를 문자열로 연결한 후 SHA-256 해시를 적용하여 고유한 거래 식별자를 만듭니다:

```
TXID = SHA-256(fromAddress + toAddress + amount + purpose + timestamp)
```

같은 내용의 거래라도 타임스탬프가 다르면 완전히 다른 TXID가 부여되므로 모든 거래를 유일하게 식별할 수 있습니다.

---

### 3. 🔑 디지털 서명 — 타원곡선 전자서명(ECDSA, secp256k1)

> 📄 구현 코드: `src/cryptoEngine.ts` — `signTransactionPayload()`(46~51행), `verifyTransactionSignature()`(54~63행) · `src/blockchain.ts` — `signTransaction()`(58~67행), `isValid()`(69~81행)

블록체인에서 "이 거래를 정말 지갑 소유자가 요청했는가"를 증명하는 메커니즘입니다. 이전 버전은 `SHA-256(트랜잭션ID + 개인키)`라는 **해시 기반 유사 서명**을 사용했지만, 이는 실제 전자서명이 아니라 "비밀값을 안다"는 것만 증명할 뿐 **서명 위조 여부를 공개키만으로 검증할 방법이 없었습니다.** 현재는 **[`elliptic`](https://www.npmjs.com/package/elliptic) 라이브러리로 구현한 실제 타원곡선 전자서명 알고리즘(ECDSA)**을 사용합니다. 이는 비트코인·이더리움 등 실제 블록체인이 사용하는 것과 동일한 곡선인 **secp256k1**입니다.

```typescript
import { ec as EC } from 'elliptic';
const ec = new EC('secp256k1');

// 서명 생성: 개인키로 트랜잭션 해시에 서명
export function signTransactionPayload(payload: string, privateKeyHex: string): string {
  const key = ec.keyFromPrivate(privateKeyHex, 'hex');
  const hash = sha256(payload);
  return key.sign(hash, { canonical: true }).toDER('hex');  // DER 인코딩된 서명
}

// 서명 검증: 공개키만으로 서명의 진위를 확인 (개인키 불필요)
export function verifyTransactionSignature(payload: string, signature: string, publicKeyHex: string): boolean {
  const key = ec.keyFromPublic(publicKeyHex, 'hex');
  const hash = sha256(payload);
  return key.verify(hash, signature);
}
```

#### 서명 생성·검증 과정

1. 관람객이 송금 또는 결제를 요청하면, `Transaction.signTransaction(privateKey)`가 호출됩니다.
2. 개인키로부터 공개키를 역산(`getPublicKeyFromPrivateKey`)하여 트랜잭션에 실어두고, 이 공개키가 실제로 `fromAddress`의 소유인지 대조합니다 — 불일치 시 `You cannot sign transactions for other wallets` 예외를 던져 **타인 명의 위조 서명 시도를 사전 차단**합니다.
3. 트랜잭션 ID(TXID)의 SHA-256 다이제스트에 대해 개인키로 ECDSA 서명을 생성, DER 형식의 16진수 문자열로 저장합니다.
4. 검증 시에는 **개인키 없이 공개키만으로** 서명이 해당 개인키 소유자에 의해 생성되었는지를 수학적으로 증명합니다 (타원곡선 이산로그 문제 기반) — 개인키를 모르는 제3자는 유효한 서명을 위조할 수 없습니다.

#### 서명 검증 규칙 (`isValid()`)

| 검증 항목 | 통과 조건 | 실패 시 |
|-----------|-----------|---------|
| **트랜잭션 무결성** | `id === calculateHash()` | 거래 본문이 전송 도중 변조된 것으로 판단 |
| **시스템 발행 거래** | `fromAddress`가 `SYSTEM` 또는 `CARD_PAYMENT`이면 서명 면제 | — |
| **서명 존재 여부** | `signature`가 존재하고 비어 있지 않아야 함 | 서명 없는 거래로 거부 |
| **공개키-주소 일치** | `addressFromPublicKey(publicKey) === fromAddress` | 서명에 포함된 공개키가 송금자 주소 소유가 아니면 거부 |
| **ECDSA 서명 검증** | `verifyTransactionSignature(id, signature, publicKey)`가 `true` | 서명이 개인키 소유자에 의해 생성되지 않았거나 위조된 것으로 판단 |

---

### 4. 👛 지갑(Wallet) — 실제 타원곡선 키 쌍 생성

> 📄 구현 코드: `src/cryptoEngine.ts` — `generateCryptoKeyPair()` (35~43행) · `src/types.ts` — `makeWallet()` (42~56행), `makeRfidWallet()` (59~70행)

각 관람객은 **공개 주소(address)**, **공개키(publicKey)**, **개인키(privateKey)**로 구성된 실제 ECDSA(secp256k1) 지갑 키 쌍을 갖습니다.

#### 키 쌍 생성 알고리즘

```typescript
// 시드 값(loginId, 이름, 또는 RFID UID)으로부터 결정론적 개인키 시드를 만든 뒤,
// elliptic의 secp256k1 곡선으로 실제 타원곡선 키 쌍을 유도한다.
export function generateCryptoKeyPair(seed: string): KeyPair {
  const seedHash = sha256(`sciblockchain_priv_${seed}`);   // 32바이트 결정론적 시드
  const key = ec.keyFromPrivate(seedHash, 'hex');           // secp256k1 개인키
  const privateKey = key.getPrivate('hex');
  const publicKey = key.getPublic('hex');                   // 비압축 공개키 (04 + X + Y)
  const address = addressFromPublicKey(publicKey);          // "0xVisitor_" + SHA-256(공개키)[:8]
  return { address, publicKey, privateKey };
}
```

- **결정론적 생성 유지**: 이전 방식(DJB2 해시)과 마찬가지로 동일한 시드(로그인 ID, 이름, RFID UID)는 항상 동일한 키 쌍을 생성합니다 — "같은 입력 → 같은 지갑"이라는 체험용 데모 동작은 그대로 유지하면서, 내부 알고리즘만 실제 암호화 표준으로 교체했습니다.
- **개인키(Private Key)**: secp256k1 곡선 위의 실제 스칼라 값(32바이트). 지갑 소유자만 알고 있어야 하며, 거래 서명에 사용됩니다. 제3자에게 노출되면 해당 개인키로 임의의 유효한 서명을 만들 수 있어 지갑의 코인이 도난당할 수 있습니다.
- **공개키(Public Key)**: 개인키로부터 타원곡선 점 곱셈(scalar multiplication)을 통해 유도되는 값으로, 개인키 없이는 역산이 불가능합니다(타원곡선 이산로그 문제). 트랜잭션 서명 검증에 사용됩니다.
- **공개 주소(Address)**: 공개키를 SHA-256 해시하여 축약한 표시용 식별자(`0xVisitor_XXXXXXXX`)로, 누구나 볼 수 있으며 코인을 수신할 때 사용합니다.
- **RFID 지갑**: RFID UID를 시드로 사용하여 동일한 방식으로 키 쌍을 생성합니다.

#### 지갑 생성/로그인 경로

> 📄 구현 코드: `src/context/VisitorContext.tsx`, `src/components/VisitorLoginScreen.tsx`

| 경로 | 설명 |
|------|------|
| **관리자 발급** | 어드민 관제 센터에서 이름(+선택적 ID/PW)을 입력해 지갑 생성, 이후 테이블에서 인라인 수정 가능 |
| **관람객 셀프 회원가입** | 관람객이 첫화면 로그인 스크린의 "회원가입" 탭에서 이름/ID/PW를 직접 입력해 계정 생성 (`registerVisitor`) |
| **관람객 로그인** | ID/PW로 인증(`authenticateVisitor`) |
| **RFID 태깅** | RFID 카드 UID 입력을 감지해 자동 로그인(`authenticateByRfid`), 등록된 UID가 없으면 안내 메시지 표시 |

---

### 5. 📦 블록(Block) — 거래 묶음과 해시 체이닝

> 📄 구현 코드: `src/blockchain.ts` — `Block` 클래스 (94~144행)

블록은 여러 트랜잭션을 하나의 단위로 묶어 원장에 기록하는 구조입니다.

#### 블록 데이터 구조

```typescript
interface IBlock {
  index: number;              // 블록 번호 (0부터 순차 증가)
  timestamp: number;          // 블록 생성 시각 (Unix 타임스탬프)
  transactions: ITransaction[];  // 이 블록에 포함된 거래 목록
  previousHash: string;       // 바로 앞 블록의 해시 값 (체인 연결고리)
  hash: string;               // 이 블록 자체의 해시 값
  nonce: number;              // 작업 증명 과정에서 찾아낸 임시 값
}
```

#### 블록 해시 계산

```
블록 해시 = SHA-256(index + previousHash + timestamp + JSON(트랜잭션 ID 목록) + nonce)
```

블록의 모든 구성 요소가 해시 입력에 포함되므로, 어느 한 필드라도 바뀌면 해시 값이 완전히 달라집니다. 이것이 블록체인의 **불변성(Immutability)**을 보장하는 핵심 원리입니다.

---

### 6. ⛏️ 작업 증명(Proof of Work) — 합의 알고리즘

> 📄 구현 코드: `src/blockchain.ts` — `Block.mineBlock()` (125~143행) · 오프스레드 버전: `src/workers/mining.worker.ts`

새로운 블록을 체인에 추가하려면 일정량의 연산 자원을 투입했음을 증명해야 합니다.

#### PoW 동작 원리

1. **난이도(Difficulty) 설정**: 해시 결과의 앞부분이 `difficulty`개의 `0`으로 시작해야 합니다.
   - 난이도 2 → 해시가 `"00..."` 으로 시작해야 유효
   - 난이도 3 → 해시가 `"000..."` 으로 시작해야 유효
2. **Nonce 반복 대입**: `nonce` 값을 0부터 1씩 증가시키며 해시를 계산하고, 조건을 만족할 때까지 반복합니다.
3. **비차단(Non-blocking) 채굴**: 브라우저 환경에서 장시간 루프가 UI를 멈추는 것을 방지하기 위해, **500회 해시 연산마다 `setTimeout(mineStep, 0)`으로 메인 스레드를 양보**합니다. 이를 통해 채굴 중에도 화면이 부드럽게 반응합니다.

```typescript
mineBlock(difficulty: number): Promise<void> {
  return new Promise((resolve) => {
    const target = Array(difficulty + 1).join('0');  // 예: "00"
    const mineStep = () => {
      for (let i = 0; i < 500; i++) {       // 500회씩 배치 처리
        this.nonce++;
        this.hash = this.calculateHash();
        if (this.hash.substring(0, difficulty) === target) {
          resolve();                          // 조건 충족 시 채굴 완료
          return;
        }
      }
      setTimeout(mineStep, 0);               // 메인 스레드 양보 후 계속
    };
    mineStep();
  });
}
```

해시 연산 자체는 `sha256()`(`crypto-js`)을 그대로 사용하므로, 메인 스레드 배치 채굴과 `src/workers/mining.worker.ts`의 Web Worker 오프스레드 채굴이 동일한 해시 함수로 통일되어 결과가 항상 일치합니다.

---

### 7. 🪙 제네시스 블록 & 토큰 경제 (Tokenomics)

> 📄 구현 코드: `src/blockchain.ts` — `Blockchain` 클래스 (146~171행), `createGenesisBlock()` (173~184행)

#### 제네시스 블록

모든 블록체인의 시작인 **0번 블록(제네시스 블록)**을 생성합니다:
- `previousHash`는 `"0"` (앞 블록이 없으므로)
- `SYSTEM` → `GENESIS` 주소로 총 공급량만큼의 코인을 발행하는 최초 트랜잭션을 포함
- 타임스탬프는 고정값(`1776268800000`)으로 설정되어 결정론적 생성 보장

#### 토큰 경제 설정

| 파라미터 | 기본값 | 설명 |
|----------|--------|------|
| `coinName` | `"SciBlockChain"` | 암호화폐 이름 |
| `expiryDate` | `"2026-12-31"` | 코인 유효기간 (만료 시 모든 거래 중단) |
| `totalSupply` | `1,000,000` | 최초 발행 총 공급량 |
| `difficulty` | `2` | PoW 채굴 난이도 |
| `miningReward` | `10` | 블록 채굴 성공 시 보상 코인 |

#### `reinitialize()` — 원장 초기화

관리자가 새로운 코인을 발행하면 기존 체인을 완전히 초기화하고 새로운 제네시스 블록부터 다시 시작합니다. 이는 행사 시작 전 깨끗한 원장을 준비하는 데 사용됩니다.

---

### 8. 📥 멤풀(Mempool) — 거래 대기열과 수명 주기

> 📄 구현 코드: `src/blockchain.ts` — `addTransaction()` (225~250행), `minePendingTransactions()` (252~271행)

#### 거래 수명 주기 (Transaction Lifecycle)

```
[거래 생성] → [서명 부여] → [유효성 검증] → [멤풀 대기] → [채굴 패키징] → [블록 확정]
```

1. **거래 생성**: 관람객이 송금 또는 결제를 요청하면 `Transaction` 객체가 생성됩니다.
2. **서명 부여**: 관람객의 개인키로 `signTransaction()`을 호출하여 ECDSA 서명과 공개키를 부여합니다.
3. **유효성 검증** (`addTransaction()`):
   - 코인 유효기간 만료 여부 확인
   - 송·수신 주소 존재 여부 확인
   - 트랜잭션 해시 무결성 및 ECDSA 서명 검증 (`isValid()`)
   - 거래 금액이 0보다 큰지 확인
   - **잔액 검증**: 송금자의 현재 잔액이 거래 금액 이상인지 확인 (이중 지불 방지)
4. **멤풀 적재**: 검증을 통과한 거래는 `pendingTransactions` 배열에 추가됩니다.
5. **채굴 패키징**: 채굴 시 멤풀의 모든 거래와 채굴 보상 거래를 묶어 새 블록을 생성합니다.
6. **블록 확정**: PoW를 통과한 블록이 체인에 추가되면 멤풀이 비워집니다.

#### 잔액 계산 방식 — UTXO 유사 모델

```typescript
getBalanceOfAddress(address: string): number {
  let balance = 0;
  // 확정된 블록의 거래를 모두 순회
  for (const block of this.chain) {
    for (const trans of block.transactions) {
      if (trans.fromAddress === address) balance -= trans.amount;  // 송금
      if (trans.toAddress === address) balance += trans.amount;    // 수신
    }
  }
  // 아직 채굴되지 않은 대기 중 거래도 반영
  for (const trans of this.pendingTransactions) {
    if (trans.fromAddress === address) balance -= trans.amount;
    if (trans.toAddress === address) balance += trans.amount;
  }
  return balance;
}
```

확정된 블록과 대기 중인 거래를 모두 반영하여 실시간 잔액을 산출합니다. 이로써 아직 채굴되지 않은 거래에 대해서도 이중 지불을 방지합니다.

---

### 9. 🔗 체인 무결성 검증 & 위변조 탐지

> 📄 구현 코드: `src/blockchain.ts` — `isChainValid()` (273~294행)
> 📄 위변조 체험 UI: `src/components/ExplorerTab.tsx` — `handleTamper()`, `executeTampering()`, `restoreTransaction()`

#### 체인 검증 알고리즘

전체 블록체인의 무결성을 4단계로 검증합니다:

```
[1단계] 제네시스 블록의 previousHash가 "0"인지 확인
   ↓
[2단계] 각 블록의 hash가 calculateHash() 결과와 일치하는지 확인
   ↓   → 불일치 시: 블록 데이터가 변조된 것
[3단계] 각 블록의 previousHash가 이전 블록의 hash와 일치하는지 확인
   ↓   → 불일치 시: 체인 연결이 끊어진 것
[4단계] 각 블록 내 모든 트랜잭션의 isValid() 재검증
       → 실패 시: 트랜잭션 내용이 변조된 것
```

#### 위변조 실습 (블록 탐색기 탭)

교육 목적으로 관리자는 블록 탐색기에서 **트랜잭션의 금액을 직접 조작**할 수 있습니다:

1. **위조 실행**: 특정 블록의 트랜잭션 금액을 변경 → 해당 블록의 해시가 깨짐
2. **체인 붕괴 감지**: `isChainValid()`가 `false`를 반환 → UI 상단에 🔴 "위변조 감지" 경고 표시
3. **복구 채굴(Re-mining)**: 위변조된 블록부터 마지막 블록까지 순차적으로 `previousHash`를 재연결하고 PoW 재채굴을 실행하여 체인을 복원
4. **원상복원**: 원본 금액으로 되돌리는 기능도 제공

---

### 10. 💾 원장 직렬화/역직렬화 & 영속 저장

> 📄 구현 코드: `src/blockchain.ts` — `exportChainData()` (341~368행), `Blockchain.fromJSON()` (370~402행)
> 📄 영속 저장 훅: `src/hooks/useBlockchainPersistence.ts`

#### JSON 직렬화 (`exportChainData()`)

전체 블록체인 원장을 JSON 형태로 내보내어 파일로 다운로드하거나 LocalStorage에 저장할 수 있습니다:

```json
{
  "coinName": "SciBlockChain",
  "expiryDate": "2026-12-31",
  "totalSupply": 1000000,
  "difficulty": 2,
  "miningReward": 10,
  "exportedAt": "2026-07-23T09:00:00.000Z",
  "chain": [
    {
      "index": 0,
      "timestamp": 1776268800000,
      "hash": "a1b2c3...",
      "previousHash": "0",
      "nonce": 0,
      "transactions": [...]
    }
  ],
  "pendingTransactions": [...]
}
```

#### 역직렬화 (`Blockchain.fromJSON()`)

저장된 JSON 데이터로부터 `Blockchain`, `Block`, `Transaction` 객체를 완전히 복원합니다. 각 트랜잭션의 `id`, `signature`, **`publicKey`**도 원본 그대로 복원되므로, 불러온 체인에서 ECDSA 서명을 포함한 `isChainValid()` 검증이 정상 통과합니다.

#### LocalStorage 자동 영속화

`useBlockchainPersistence` 훅이 React 상태 변경을 감지하여 4가지 데이터를 자동으로 LocalStorage에 저장합니다:

| 저장 키 | 내용 |
|---------|------|
| `sciblockchain_ledger_v3` | 전체 블록체인 원장 (체인 + 대기 거래) |
| `sciblockchain_visitors_v3` | 모든 관람객 지갑 정보 |
| `sciblockchain_booths_v3` | 부스 설정 및 수익 데이터 |
| `sciblockchain_processed_txs_v3` | 부스 결제 완료 처리 상태 |

브라우저를 새로고침하거나 재방문해도 이전 체험 상태가 그대로 복원됩니다.

> ⚠️ **저장 키 버전(`v2` → `v3`)**: 지갑/서명 체계가 해시 기반 유사 서명에서 실제 ECDSA로 바뀌면서 기존 `v2` 데이터와 호환되지 않습니다. 이전 버전에서 저장된 지갑·원장은 자동 마이그레이션되지 않고, 새 `v3` 키로 완전히 새로운 상태에서 시작합니다.

---

### 11. 📊 온체인 분석 엔진 (On-chain Analytics)

> 📄 구현 코드: `src/blockchain.ts` — `getTransactionHistory()` (298~313행), `getTotalTransactionVolume()` (315~325행), `getBlockStats()` (327~339행)

블록체인 원장 데이터를 직접 순회하여 다양한 통계를 실시간으로 산출합니다:

| 메서드 | 기능 |
|--------|------|
| `getTransactionHistory(address)` | 특정 주소의 모든 거래 내역을 시간순으로 조회 (확정 + 대기 모두 포함) |
| `getTotalTransactionVolume()` | 시스템 발행 거래를 제외한 실질 거래 총액 계산 |
| `getBlockStats()` | 평균 블록 생성 시간 및 전체 트랜잭션 수 산출 |
| `getBalanceOfAddress(address)` | 특정 주소의 실시간 잔액 조회 |

---

### 12. 📚 사용 암호화 라이브러리 요약

> 📄 통합 모듈: `src/cryptoEngine.ts`

이전 버전은 SHA-256과 서명 로직을 모두 순수 TypeScript로 직접 구현했지만, 현재는 실제 암호화 라이브러리 2종을 도입하여 `src/cryptoEngine.ts` 한 곳에서 관리합니다. `src/blockchain.ts`, `src/types.ts`, `src/workers/mining.worker.ts` 등 프로젝트 전체가 이 모듈을 통해서만 암호 연산을 수행합니다.

| 라이브러리 | 버전 관리 | 담당 기능 | 실제 사용처 | 적용 전(v2) 대비 개선점 |
|-----------|----------|-----------|-------------|--------------------------|
| **[`crypto-js`](https://www.npmjs.com/package/crypto-js)** | `package.json` `dependencies` | SHA-256 해시 (`CryptoJS.SHA256`) | 블록 해시, 트랜잭션 ID, 지갑 주소 파생, ECDSA 서명 전 메시지 다이제스트 | 검증되지 않은 자체 구현 대신, 널리 쓰이고 테스트된 해시 구현체 사용 |
| **[`elliptic`](https://www.npmjs.com/package/elliptic)** | `package.json` `dependencies` | secp256k1 타원곡선 키 생성, ECDSA 서명/검증 | 지갑 키 쌍 생성(`generateCryptoKeyPair`), 거래 서명(`signTransactionPayload`), 서명 검증(`verifyTransactionSignature`) | 해시만으로 흉내 내던 유사 서명을 실제 전자서명(공개키로 위조 여부 검증 가능)으로 대체 |

```
관람객 지갑 생성  →  generateCryptoKeyPair(seed)  →  elliptic (secp256k1 키 쌍) + crypto-js (SHA-256 주소 파생)
거래 서명         →  signTransaction(privateKey)   →  elliptic ECDSA 서명 (crypto-js로 만든 TXID 해시에 대해)
거래 검증         →  isValid()                     →  elliptic 공개키 검증 + crypto-js 해시 재계산
블록 채굴         →  mineBlock(difficulty)          →  crypto-js SHA-256 반복 계산 (PoW)
```

타입 안전성을 위해 `@types/crypto-js`, `@types/elliptic`도 `devDependencies`에 함께 추가되어 있습니다.

> ℹ️ **참고**: `elliptic`은 npm 생태계에서 비트코인 관련 JS 라이브러리들이 널리 사용하는 타원곡선 구현체이지만, 알려진 보안 권고(서명 관련 구현 이슈)가 존재합니다. 이 프로젝트는 실제 자산이 오가지 않는 **행사용 교육 시뮬레이션**이므로 학습 목적상 채택했으며, 실거래를 다루는 프로덕션 환경에는 별도의 보안 검토가 필요합니다.

---

## 🏗️ 프로젝트 구조

```
src/
├── blockchain.ts                 # Transaction + Block + Blockchain 코어 (해시/서명은 cryptoEngine.ts 위임)
├── cryptoEngine.ts                # 암호화 라이브러리 통합 모듈 — crypto-js(SHA-256) + elliptic(ECDSA secp256k1)
├── types.ts                      # Booth, VisitorWallet, ReceiptData 타입 및 지갑 생성 함수 (cryptoEngine 기반)
├── App.tsx                       # 메인 오케스트레이터
├── index.css                     # 소프트 파스텔 디자인 시스템
├── context/
│   ├── BlockchainContext.tsx      # 블록체인 전역 상태 + 채굴 + 재채굴 로직 (실제 사용되는 Provider)
│   ├── VisitorContext.tsx         # 관람객 지갑 CRUD + 로그인/회원가입/RFID 인증
│   └── AuthContext.tsx            # 관리자/관람객 인증 세션 관리
├── hooks/
│   ├── useBlockchainPersistence.ts  # LocalStorage 자동 영속화 훅 (v3 키, ECDSA 서명 구조 반영)
│   ├── useBlockchain.ts           # BlockchainContext와 동일 로직의 독립 훅 (현재 미사용, 레거시/대체 구현)
│   └── useToast.ts               # 알림 토스트 제어 훅
├── workers/
│   └── mining.worker.ts           # Web Worker 기반 PoW 채굴 구현 (cryptoEngine의 SHA-256 재사용, 현재 UI 미연결)
└── components/
    ├── LandingScreen.tsx          # 첫화면 포털
    ├── AdminLoginModal.tsx        # 관리자 승인 모달
    ├── VisitorLoginScreen.tsx     # 관람객 로그인 / 회원가입 / RFID 태깅 (3-탭)
    ├── AdminTab.tsx               # 코인 발행 & 관제 센터
    ├── WalletTab.tsx              # 지갑 관리 & 송금 & 충전
    ├── BoothTab.tsx               # 부스 QR 결제 & 모니터링
    ├── ExplorerTab.tsx            # 블록 탐색기 & 위변조 실습
    ├── AnalyticsTab.tsx           # SVG 데이터 분석 대시보드
    ├── CardPaymentModal.tsx       # 가상 PG 카드 결제 모달
    ├── TransactionReceipt.tsx     # 암호학 영수증 & 인쇄
    ├── VisualQRCode.tsx           # SVG QR 코드 생성기
    ├── NetworkStatsBar.tsx        # 네트워크 상태 바
    ├── Toast.tsx                  # 알림 컴포넌트
    └── ErrorBoundary.tsx          # 런타임 에러 격리 경계
```

---

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | React 19, TypeScript, Vite |
| **UI/UX** | Vanilla CSS3, Soft Pastel Light Theme, Lucide Icons |
| **Cryptography** | `crypto-js`(SHA-256), `elliptic`(ECDSA secp256k1 키 생성·서명·검증) |
| **Blockchain Engine** | PoW 합의, 멤풀 관리, 체인 무결성 검증 (`src/blockchain.ts`) |
| **Effects** | Canvas Confetti (채굴 성공 시 축하 효과) |
| **Persistence** | LocalStorage 기반 자동 저장·복원 (`v3` 스키마) |

---

## 🚀 로컬 실행 방법

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

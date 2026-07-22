// Sync SHA-256 function in pure TypeScript
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiLength = ascii[lengthProperty];

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime = function (n: number) {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // ASCII check
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = ((asciiLength * 8) / maxWord) | 0;
  words[words[lengthProperty]] = (asciiLength * 8) | 0;

  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);
    for (i = 0; i < 64; i++) {
      let wItem = w[i];
      if (i >= 16) {
        const s0 =
          rightRotate(w[i - 15], 7) ^
          rightRotate(w[i - 15], 18) ^
          (w[i - 15] >>> 3);
        const s1 =
          rightRotate(w[i - 2], 17) ^
          rightRotate(w[i - 2], 19) ^
          (w[i - 2] >>> 10);
        wItem = w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj =
        (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const s0_h =
        rightRotate(hash[0], 2) ^
        rightRotate(hash[0], 13) ^
        rightRotate(hash[0], 22);
      const s1_h =
        rightRotate(hash[4], 6) ^
        rightRotate(hash[4], 11) ^
        rightRotate(hash[4], 25);
      const temp1 = hash[7] + s1_h + ch + k[i] + (wItem || 0);
      const temp2 = s0_h + maj;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    let val = hash[i];
    if (val < 0) val += maxWord;
    let str = val.toString(16);
    while (str[lengthProperty] < 8) str = '0' + str;
    result += str;
  }
  return result;
}

export interface ITransaction {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  timestamp: number;
  purpose: string;
  signature: string;
}

export class Transaction implements ITransaction {
  public id: string;
  public signature: string = '';
  public fromAddress: string;
  public toAddress: string;
  public amount: number;
  public purpose: string;
  public timestamp: number;

  constructor(
    fromAddress: string,
    toAddress: string,
    amount: number,
    purpose: string = 'Transfer',
    timestamp: number = Date.now()
  ) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.purpose = purpose;
    this.timestamp = timestamp;
    this.id = this.calculateHash();
  }

  calculateHash(): string {
    return sha256(
      this.fromAddress +
        this.toAddress +
        this.amount.toString() +
        this.purpose +
        this.timestamp.toString()
    );
  }

  signTransaction(privateKey: string) {
    if (privateKey === '') {
      throw new Error('Cannot sign with an empty key');
    }
    this.signature = sha256(this.id + privateKey);
  }

  isValid(): boolean {
    if (this.fromAddress === 'SYSTEM' || this.fromAddress === 'CARD_PAYMENT') return true;
    if (!this.signature || this.signature.length === 0) {
      return false;
    }
    return true;
  }
}

export interface IBlock {
  index: number;
  timestamp: number;
  transactions: ITransaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  minerAddress?: string;
}

export class Block implements IBlock {
  public hash: string;
  public nonce: number = 0;
  public index: number;
  public timestamp: number;
  public transactions: Transaction[];
  public previousHash: string;

  constructor(
    index: number,
    timestamp: number,
    transactions: Transaction[],
    previousHash: string = ''
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    return sha256(
      this.index.toString() +
        this.previousHash +
        this.timestamp.toString() +
        JSON.stringify(this.transactions.map((tx) => tx.id)) +
        this.nonce.toString()
    );
  }

  mineBlock(difficulty: number): Promise<void> {
    return new Promise((resolve) => {
      const target = Array(difficulty + 1).join('0');
      
      const mineStep = () => {
        for (let i = 0; i < 500; i++) {
          this.nonce++;
          this.hash = this.calculateHash();
          if (this.hash.substring(0, difficulty) === target) {
            resolve();
            return;
          }
        }
        setTimeout(mineStep, 0);
      };
      
      mineStep();
    });
  }
}

export class Blockchain {
  public chain: Block[];
  public difficulty: number = 2;
  public pendingTransactions: Transaction[];
  public miningReward: number = 10;

  // Custom Coin Configurable Parameters
  public coinName: string = 'SciBlockChain';
  public expiryDate: string = '2026-12-31';
  public totalSupply: number = 1000000;

  constructor(coinName: string = 'SciBlockChain', expiryDate: string = '2026-12-31', totalSupply: number = 1000000) {
    this.coinName = coinName;
    this.expiryDate = expiryDate;
    this.totalSupply = totalSupply;
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
  }

  reinitialize(coinName: string, expiryDate: string, totalSupply: number) {
    this.coinName = coinName;
    this.expiryDate = expiryDate;
    this.totalSupply = totalSupply;
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
  }

  createGenesisBlock(): Block {
    const genesisTx = new Transaction(
      'SYSTEM', 
      'GENESIS', 
      this.totalSupply, 
      `${this.coinName} 최초 발행 (유효기간: ${this.expiryDate})`
    );
    genesisTx.signature = 'GENESIS_SIGN';
    const genesisBlock = new Block(0, 1776268800000, [genesisTx], '0');
    genesisBlock.hash = genesisBlock.calculateHash();
    return genesisBlock;
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  isExpired(): boolean {
    const expiryTime = new Date(this.expiryDate).getTime();
    const today = new Date();
    // Clean to compare date portion
    today.setHours(0, 0, 0, 0);
    const expiryDateObj = new Date(expiryTime);
    expiryDateObj.setHours(23, 59, 59, 999);
    return today.getTime() > expiryDateObj.getTime();
  }

  getBalanceOfAddress(address: string): number {
    let balance = 0;
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }
        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }
    
    for (const trans of this.pendingTransactions) {
      if (trans.fromAddress === address) {
        balance -= trans.amount;
      }
    }
    
    return balance;
  }

  addTransaction(transaction: Transaction) {
    if (this.isExpired()) {
      throw new Error(`코인의 유효기간(${this.expiryDate})이 만료되어 거래를 처리할 수 없습니다.`);
    }

    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }

    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain');
    }

    if (transaction.amount <= 0) {
      throw new Error('Transaction amount must be greater than 0');
    }

    if (transaction.fromAddress !== 'SYSTEM' && transaction.fromAddress !== 'CARD_PAYMENT') {
      const balance = this.getBalanceOfAddress(transaction.fromAddress);
      if (balance < transaction.amount) {
        throw new Error('Not enough balance in wallet');
      }
    }

    this.pendingTransactions.push(transaction);
  }

  async minePendingTransactions(miningRewardAddress: string): Promise<Block> {
    const rewardTx = new Transaction('SYSTEM', miningRewardAddress, this.miningReward, 'Mining Reward');
    rewardTx.signature = 'MINING_REWARD_SIGN';
    
    const transactionsToMine = [...this.pendingTransactions, rewardTx];
    
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      transactionsToMine,
      this.getLatestBlock().hash
    );

    await newBlock.mineBlock(this.difficulty);

    this.chain.push(newBlock);
    this.pendingTransactions = [];

    return newBlock;
  }

  isChainValid(): boolean {
    const genesis = this.chain[0];
    if (genesis.previousHash !== '0') return false;
    
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      for (const tx of currentBlock.transactions) {
        if (!tx.isValid()) return false;
      }
    }
    return true;
  }

  // === New analytics methods ===

  getTransactionHistory(address: string): Transaction[] {
    const history: Transaction[] = [];
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress === address || tx.toAddress === address) {
          history.push(tx);
        }
      }
    }
    for (const tx of this.pendingTransactions) {
      if (tx.fromAddress === address || tx.toAddress === address) {
        history.push(tx);
      }
    }
    return history.sort((a, b) => b.timestamp - a.timestamp);
  }

  getTotalTransactionVolume(): number {
    let total = 0;
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress !== 'SYSTEM') {
          total += tx.amount;
        }
      }
    }
    return total;
  }

  getBlockStats(): { avgBlockTime: number; totalTxCount: number } {
    let totalTxCount = 0;
    let avgBlockTime = 0;
    const minedBlocks = this.chain.slice(1);
    if (minedBlocks.length > 1) {
      const times = minedBlocks.map(b => b.timestamp);
      const diffs: number[] = [];
      for (let i = 1; i < times.length; i++) diffs.push(times[i] - times[i - 1]);
      avgBlockTime = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    }
    for (const block of this.chain) totalTxCount += block.transactions.length;
    return { avgBlockTime, totalTxCount };
  }

  exportChainData(): string {
    return JSON.stringify({
      coinName: this.coinName,
      expiryDate: this.expiryDate,
      totalSupply: this.totalSupply,
      difficulty: this.difficulty,
      exportedAt: new Date().toISOString(),
      chain: this.chain.map(b => ({
        index: b.index,
        timestamp: b.timestamp,
        hash: b.hash,
        previousHash: b.previousHash,
        nonce: b.nonce,
        transactions: b.transactions.map(tx => ({
          id: tx.id,
          fromAddress: tx.fromAddress,
          toAddress: tx.toAddress,
          amount: tx.amount,
          purpose: tx.purpose,
          timestamp: tx.timestamp,
        })),
      })),
    }, null, 2);
  }
}


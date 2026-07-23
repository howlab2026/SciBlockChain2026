// SHA-256 (crypto-js) and ECDSA signing (elliptic) — see ./cryptoEngine.ts
import {
  sha256,
  signTransactionPayload,
  verifyTransactionSignature,
  getPublicKeyFromPrivateKey,
  addressFromPublicKey,
} from './cryptoEngine';

export { sha256 };

export interface ITransaction {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  timestamp: number;
  purpose: string;
  signature: string;
  publicKey: string;
}

export class Transaction implements ITransaction {
  public id: string;
  public signature: string = '';
  public publicKey: string = '';
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
    this.publicKey = getPublicKeyFromPrivateKey(privateKey);
    if (addressFromPublicKey(this.publicKey) !== this.fromAddress) {
      throw new Error('You cannot sign transactions for other wallets');
    }
    this.signature = signTransactionPayload(this.id, privateKey);
  }

  isValid(): boolean {
    if (this.id !== this.calculateHash()) {
      return false; // Transaction payload was tampered!
    }
    if (this.fromAddress === 'SYSTEM' || this.fromAddress === 'CARD_PAYMENT') return true;
    if (!this.signature || this.signature.length === 0) {
      return false;
    }
    if (!this.publicKey || addressFromPublicKey(this.publicKey) !== this.fromAddress) {
      return false; // signature's public key does not belong to the sender's address
    }
    return verifyTransactionSignature(this.id, this.signature, this.publicKey);
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
      if (trans.toAddress === address) {
        balance += trans.amount;
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
      miningReward: this.miningReward,
      exportedAt: new Date().toISOString(),
      pendingTransactions: this.pendingTransactions,
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
          signature: tx.signature,
          publicKey: tx.publicKey,
        })),
      })),
    }, null, 2);
  }

  static fromJSON(data: any): Blockchain {
    const bc = new Blockchain(data.coinName || 'SciBlockChain', data.expiryDate || '2026-12-31', data.totalSupply || 1000000);
    if (data.difficulty) bc.difficulty = data.difficulty;
    if (data.miningReward) bc.miningReward = data.miningReward;
    
    if (Array.isArray(data.chain) && data.chain.length > 0) {
      bc.chain = data.chain.map((b: any) => {
        const txs = Array.isArray(b.transactions) ? b.transactions.map((t: any) => {
          const tx = new Transaction(t.fromAddress, t.toAddress, t.amount, t.purpose, t.timestamp);
          tx.id = t.id || tx.id;
          tx.signature = t.signature || '';
          tx.publicKey = t.publicKey || '';
          return tx;
        }) : [];
        const block = new Block(b.index, b.timestamp, txs, b.previousHash);
        block.hash = b.hash;
        block.nonce = b.nonce;
        return block;
      });
    }

    if (Array.isArray(data.pendingTransactions)) {
      bc.pendingTransactions = data.pendingTransactions.map((t: any) => {
        const tx = new Transaction(t.fromAddress, t.toAddress, t.amount, t.purpose, t.timestamp);
        tx.id = t.id || tx.id;
        tx.signature = t.signature || '';
        tx.publicKey = t.publicKey || '';
        return tx;
      });
    }

    return bc;
  }
}



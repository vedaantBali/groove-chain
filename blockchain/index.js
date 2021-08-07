const Block = require("./block");
const Transaction = require("../wallet/transaction");
const Wallet = require("../wallet");
const { cryptoHash } = require("../util");
const { REWARD_INPUT, MINING_REWARD } = require("../config");

class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }

    addBlock({ data }) {
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length - 1],
            data
        })

        this.chain.push(newBlock);
    }

    replaceChain(chain, validateTransactions, onSuccess) {
        if(chain.length <= this.chain.length) {
            console.error('incoming chain must be longer than current instance');
            return ;
        }

        if(!Blockchain.isChainValid(chain)) {
            console.error('incoming chain is invalid');
            return ;
        }

        if(validateTransactions && !this.validTransactionData({ chain })) {
            console.error('incoming chain contains invalid data');
            return ;
        }

        if(onSuccess) onSuccess();

        console.log('replacing chain with ', chain);
        this.chain = chain;
    }

    validTransactionData({ chain }) {
        for(let i=1; i<chain.length; i++) {
            const block = chain[i];
            const transactionSet = new Set();
            let rewardTransactionCount = 0;

            for(let transaction of block.data) {
                if(transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactionCount++;

                    if(rewardTransactionCount > 1) {
                        console.error('Miner reward exceeds limit');
                        return false;
                    }

                    if(Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error('Miner reward is invalid');
                        return false;
                    }
                } else {
                    if(!Transaction.validTransaction(transaction)) {
                        console.error('Invalid transaction');
                        return false;
                    }

                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address,
                        timestamp: transaction.input.timestamp
                    });

                    if(transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount');
                        return false;
                    }

                    if(transactionSet.has(transaction)) {
                        console.error('Multiple repeated transactions detected');
                        return false;
                    } else {
                        transactionSet.add(transaction);
                    }
                }
            }
        }
        return true;
    }

    static isChainValid(chain) {
        if(JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;
        
        for(let i=1; i<chain.length; i++) {
            const { timestamp, lastHash, hash, nonce, difficulty, data } = chain[i];
            const actualLastHash = chain[i-1].hash;
            const lastDifficulty = chain[i-1].difficulty;

            if(lastHash !== actualLastHash) return false;
            
            const validatedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);

            if(hash !== validatedHash) return false;

            if(Math.abs(lastDifficulty - difficulty) > 1) return false;
        }
        return true;
    }

}

module.exports = Blockchain;
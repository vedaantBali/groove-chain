const Transaction = require("../wallet/transaction");

class TransactionMiner {

    constructor({ blockchain, transactionPool, wallet, pubsub }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.pubsub = pubsub;
    }

    mineTransactions() {
        // get the transaction pools valid transactions
        const validTransactions = this.transactionPool.validTransactions();

        // generate miners reward and push it to the validTransactions array
        validTransactions.push(Transaction.rewardTransaction({ minerWallet: this.wallet}));

        // add block consisting of these transactions to the blockchain
        this.blockchain.addBlock({
            data: validTransactions
        });
        
        // broadcast the updated chain
        this.pubsub.broadcastChains();

        // clear the transaction pool
        this.transactionPool.clear();
    }
}

module.exports = TransactionMiner;
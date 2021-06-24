const uuid = require('uuid').v1;
const { verifySignature } = require('../util');
const { MINING_REWARD, REWARD_INPUT } = require('../config');

class Transaction {
    constructor({ senderWallet, receiver, amount, outputMap, input }) {
        this.id = uuid();
        this.outputMap = outputMap || this.createOutputMap({ senderWallet, receiver, amount });
        this.input = input || this.createInput({senderWallet, outputMap: this.outputMap});
    }

    createOutputMap({ senderWallet, receiver, amount }) {
        const outputMap = {};

        outputMap[receiver] = amount;
        outputMap[senderWallet.publicKey] = senderWallet.balance - amount;

        return outputMap;
    }

    createInput({ senderWallet, outputMap }) {
        return {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(outputMap)
        };
    }

    update({ senderWallet, receiver, amount }) {
        if(amount > this.outputMap[senderWallet.publicKey]) {
            throw new Error('Amount exceeds balance');
        }

        if(!this.outputMap[receiver]) {
            this.outputMap[receiver] = amount;
        } else {
            this.outputMap[receiver] = this.outputMap[receiver] + amount;
        }

        this.outputMap[senderWallet.publicKey] =
            this.outputMap[senderWallet.publicKey] - amount;
        
        this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
    }

    static validTransaction(transaction) {
        const { input: { address, amount, signature}, outputMap} = transaction;
        const outputTotal = Object.values(outputMap)
            .reduce((total, outputAmount) => total + outputAmount);

        if(amount !== outputTotal) {
            console.error(`invalid transaction from ${address}`);
            return false;
        }

        if(!verifySignature({ publicKey: address, data: outputMap, signature})) {
            console.error(`Invalid signature from ${address}`);
            return false;
        }

        return true;
    }

    static rewardTransaction({ minerWallet }) {
        return new this({
            input: REWARD_INPUT,
            outputMap: { [minerWallet.publicKey] : MINING_REWARD }
        });
    }
}

module.exports = Transaction;
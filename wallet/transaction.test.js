const Wallet = require('.');
const { REWARD_INPUT, MINING_REWARD } = require('../config');
const { verifySignature } = require('../util');
const Transaction = require('./transaction');

describe('Transaction', () => {
    let transaction, senderWallet, receiver, amount;

    beforeEach(() => {
        senderWallet = new Wallet();
        receiver = 'r3c3iv3r-pu8l1c-k3y';
        amount = 50;

        transaction = new Transaction({
            senderWallet, 
            receiver, 
            amount
        });
    });
    it('has an `id`', () => {
        expect(transaction).toHaveProperty('id');
    });

    describe('outputMap', () => {

        it('has an `outputMap`', () => {
            expect(transaction).toHaveProperty('outputMap');
        });

        it('outputs the amount to the receiver', () => {
            expect(transaction.outputMap[receiver]).toEqual(amount);
        });

        it('outputs the remaining balance in `senderWallet`', () => {
            expect(transaction.outputMap[senderWallet.publicKey])
                .toEqual(senderWallet.balance - amount);
        });
    });

    describe('input', () => {
        it('has an input', () => {
            expect(transaction).toHaveProperty('input');
        });

        it('has a `timestamp` in the input', () => {
            expect(transaction.input).toHaveProperty('timestamp');
        });

        it('sets an `amount` to the `senderWallet` balance', () => {
            expect(transaction.input.amount).toEqual(senderWallet.balance);
        });

        it('sets the `address` to the `senderWallet` publicKey', () => {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        });

        it('signs the input', () => {
            expect(
                verifySignature({
                    publicKey: senderWallet.publicKey,
                    data: transaction.outputMap,
                    signature: transaction.input.signature
                })
            ).toBe(true);
        });
    });

    describe('validTransaction()', () => {

        let errorMock;

        beforeEach(() => {
            errorMock = jest.fn();
            global.console.error = errorMock;
        });

        describe('when the transaction is valid', () => {
            it('returns true', () => {
                expect(Transaction.validTransaction(transaction)).toBe(true);
            });
        });

        describe('when the transaction is invalid', () => {
            describe('and a transaction outputMap value is invalid', () => {
                it('return false and logs error', () => {
                    transaction.outputMap[senderWallet.publicKey] = 9999999;
                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            
            describe('and a transaction input signature is invalid', () => {
                it('return false and logs error', () => {
                    transaction.input.signature = new Wallet().sign('data');
                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });

    });

    describe('update()', () => {
        let originalSignature, originalSenderOutput, nextReceiver, nextAmount;

        describe('and the amount is invalid', () => {
            it('throws an error', () => {
                expect(() => {
                    transaction.update({ senderWallet, receiver: 'foo', amount: 999999 });
                }).toThrow('Amount exceeds balance');
                
            }); 
        });

        describe(' and the amount is valid', () => {
            beforeEach(() => {
                originalSignature = transaction.input.signature;
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                nextReceiver = 'next-receiver';
                nextAmount = 50;
    
                transaction.update({ 
                    senderWallet, 
                    receiver: nextReceiver, 
                    amount: nextAmount 
                });
            });
    
            it('outputs the amount to the next receiver', () => {
                expect(transaction.outputMap[nextReceiver]).toEqual(nextAmount);
            });
    
            it('subtracts the amount from original sender output amount', () => {
                expect(transaction.outputMap[senderWallet.publicKey])
                    .toEqual(originalSenderOutput - nextAmount);
            });
    
            it('maintains a total output that matches the input amount', () => {
                expect(Object.values(transaction.outputMap)
                    .reduce((total, outputAmount) => total + outputAmount))
                        .toEqual(transaction.input.amount);
                
            });
    
            it('re-signs the transactions', () => {
                expect(transaction.input.signature).not.toEqual(originalSignature);
            });

            describe('another update for the same receiver', () => {
                let addedAmount;

                beforeEach(() => {
                    addedAmount = 80;
                    transaction.update({
                        senderWallet, receiver: nextReceiver, amount: addedAmount
                    });
                });

                it('adds to the receiver amount', () => {
                    expect(transaction.outputMap[nextReceiver])
                        .toEqual(nextAmount + addedAmount);
                });

                it('should subtract the amount from original sender output amount', () => {
                    expect(transaction.outputMap[senderWallet.publicKey])
                        .toEqual(originalSenderOutput - nextAmount - addedAmount);
                });
            });
        });

        
    });

    describe('rewardTransaction()', () => {
        let rewardTransaction, minerWallet;

        beforeEach(() => {
            minerWallet = new Wallet();
            rewardTransaction = Transaction.rewardTransaction({
                minerWallet
            });
        });

        it('creates a transaction with the reward input', () => {
            expect(rewardTransaction.input).toEqual(REWARD_INPUT);
        });

        it('creates one transaction for the miner with the `MINING_REWARD`', () => {
            expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
        });
    });
});
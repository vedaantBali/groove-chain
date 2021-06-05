const Block = require("./block");
const { cryptoHash } = require('../util');
const Blockchain = require(".");
const Wallet = require("../wallet");
const Transaction = require("../wallet/transaction");

describe('Blockchain', () => {
    let errorMock, blockchain, newChain, originalChain;

    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        errorMock = jest.fn();

        originalChain = blockchain.chain;
        global.console.error = errorMock;
    })

    it('consists of a `chain` array instance', () => {
        expect(blockchain.chain instanceof Array).toBe(true);
    });

    it('starts with the genesis block', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis());
    });

    it('adds a new block to the chain', () => {
        const newData = 'foo bar';
        blockchain.addBlock({ data: newData });
        
        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData);
    });

    describe('isChainValid()', () => {
        
        describe('when the chain does not start with genesis', () => {
            it('returns false', () => {
                blockchain.chain[0] = {
                    data: 'new genesis'
                }

                expect(Blockchain.isChainValid(blockchain.chain)).toBe(false);
            });
        });

        describe('when the chain starts with the genesis and has multiple blocks', () => {

            beforeEach(() => {
                blockchain.addBlock({
                    data: 'Bears'
                });
                blockchain.addBlock({
                    data: 'Beets'
                });
                blockchain.addBlock({
                    data: 'Battlestar Galactica'
                });
            })

            describe('and a lastHash reference has changed', () => {
                it('returns false', () => {
                    blockchain.chain[2].lastHash = 'broken-hash';

                    expect(Blockchain.isChainValid(blockchain.chain)).toBe(false);
                });
            })

            describe(' and a chain contains a block with an invalid field', () => {
                it('returns false', () => {
                    blockchain.chain[2].data = 'mose';

                    expect(Blockchain.isChainValid(blockchain.chain)).toBe(false);
                }) 
            });

            describe('and the chain contains a block with jumped difficulty', () => {
                it('returns false', () => {
                    const lastBlock = blockchain.chain[blockchain.chain.length-1];
                    const lastHash = lastBlock.hash;
                    const timestamp = Date.now();
                    const nonce = 0;
                    const data = [];
                    const difficulty = lastBlock.difficulty - 3;
                    const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data);
                    const badBlock = new Block({
                        timestamp, lastHash, hash, nonce, difficulty, data
                    });

                    blockchain.chain.push(badBlock);
                    
                    expect(Blockchain.isChainValid(blockchain.chain)).toBe(false);
                });
            });

            describe(' and the chain does not contain any invalid blocks', () => {
                it('returns true', () => {
                    expect(Blockchain.isChainValid(blockchain.chain)).toBe(true);
                });
            });
        });
    });

    describe('replaceChain()', () => {
        let logMock;

        beforeEach(() => {
            logMock = jest.fn();

            global.console.log = logMock;
        })

        describe('new chain is not longer', () => {
            beforeEach(() => {
                newChain[0] = { new: 'chain' };
                blockchain.replaceChain(newChain.chain);
            })
            it('does not replace the chain', () => {
                expect(blockchain.chain).toEqual(originalChain);
            });

            it('logs an error', () => {
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('new chain is longer', () => {
            beforeEach(() => {
                newChain.addBlock({
                    data: 'Bears'
                });
                newChain.addBlock({
                    data: 'Beets'
                });
                newChain.addBlock({
                    data: 'Battlestar Galactica'
                });
            });

            describe('and the chain is invalid', () => {
                beforeEach(() => {
                    newChain.chain[2].hash = 'new-fake-hash';
                    blockchain.replaceChain(newChain.chain);
                });

                it('does not replace the chain', () => {
                    expect(blockchain.chain).toEqual(originalChain);
                });
            });

            describe('and the chain is valid', () => {
                beforeEach(() => {
                    blockchain.replaceChain(newChain.chain);
                });

                it('it replaces the chain', () => {
                    expect(blockchain.chain).toEqual(newChain.chain);
                });

                it('logs about chain replacement', () => {
                    expect(logMock).toHaveBeenCalled();
                })
            });
        });

        describe('and the validateTransactions flag is true', () => {
            it('calls validTransactionData', () => {
                const validTransactionDataMock = jest.fn();

                blockchain.validTransactionData = validTransactionDataMock;
                newChain.addBlock({
                    data: 'foo'
                });
                blockchain.replaceChain(newChain.chain, true);

                expect(validTransactionDataMock).toHaveBeenCalled();
            });
        });
    });

    describe('validTransactionData()', () => {
        let transaction, rewardTransaction, wallet;

        beforeEach(() => {
            wallet = new Wallet();
            transaction = wallet.createTransaction({
                receiver: 'n3w-v3d44nt',
                amount: 65
            });

            rewardTransaction = Transaction.rewardTransaction({
                minerWallet: wallet
            });
        });

        describe('and the transaction data is valid', () => {
            it('returns true', () => {
                newChain.addBlock({
                    data: [transaction, rewardTransaction]
                });
                expect(blockchain.validTransactionData({
                    chain: newChain.chain
                })).toBe(true);

                expect(errorMock).not.toHaveBeenCalled();

            });
        });

        describe('and the transaction data has multiple rewards', () => {
            it('returns false and logs an error', () => {
                newChain.addBlock({
                    data: [transaction, rewardTransaction, rewardTransaction]
                });

                expect(blockchain.validTransactionData({
                    chain: newChain.chain
                })).toBe(false);

                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('and the transaction data has at least one malformed outputMap', () => {

            describe('and the transaction is not a reward transaction', () => {
                it('returns false and logs an error', () => {
                    transaction.outputMap[wallet.publicKey] = 999999;

                    newChain.addBlock({
                        data: [transaction, rewardTransaction]
                    });

                    expect(blockchain.validTransactionData({
                        chain: newChain.chain
                    })).toBe(false);

                expect(errorMock).toHaveBeenCalled();

                });
            });

            describe('and the transaction is a reward transaction', () => {
                it('returns false and logs an error', () => {
                    rewardTransaction.outputMap[wallet.publicKey] = 999999;

                    newChain.addBlock({
                        data: [transaction, rewardTransaction]
                    });

                    expect(blockchain.validTransactionData({
                        chain: newChain.chain
                    })).toBe(false);

                expect(errorMock).toHaveBeenCalled();
                });
            });
        });

        describe('and the transaction data has at least one malformed input', () => {
            it('returns false and logs an error', () => {
                wallet.balance = 999999;

                const evilOutputMap = {
                    [wallet.publicKey]: 999999-100,
                    receiver: 100,
                };

                const evilTransaction = {
                    input: {
                        timestamp: Date.now(),
                        amount: wallet.balance,
                        address: wallet.publicKey,
                        signature: wallet.sign(evilOutputMap)
                    },
                    outputMap: evilOutputMap
                }

                newChain.addBlock({
                    data: [ evilTransaction, rewardTransaction ]
                });
                
                expect(blockchain.validTransactionData({
                    chain: newChain.chain
                })).toBe(false);
                
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('and a block contains multiple identical transactions', () => {
            it('returns false and logs an error', () => {
                newChain.addBlock({
                    data: [transaction, transaction, transaction]
                });

                expect(blockchain.validTransactionData({
                    chain: newChain.chain
                })).toBe(false);
                
                expect(errorMock).toHaveBeenCalled();
            });
        });
    });
})
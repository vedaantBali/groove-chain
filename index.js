const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path'); 
const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');

const isDevelopment = process.env.ENV === 'development';
const REDIS_URL = isDevelopment ? 
    'redis://127.0.0.1:6379' :
    'redis://:p7f50e7fd5f5bd0f3155b88d569b370e084c26ee0ee4a00d683c380aaadc47e4d@ec2-34-236-43-44.compute-1.amazonaws.com:25239'
const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}` ;

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool, redisUrl: REDIS_URL });
const transactionMiner = new TransactionMiner({
    blockchain, transactionPool, wallet, pubsub
});


app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/api/blocks', (req, res) => {
    res.json(blockchain.chain);
});

app.post('/api/mine', (req, res) => {
    const { data } = req.body;

    blockchain.addBlock({ data });

    pubsub.broadcastChains();
    res.redirect('/api/blocks');
});

app.post('/api/transact', (req, res) => {
    const { amount, receiver } = req.body;
    let transaction = transactionPool
    .existingTransaction({ inputAddress: wallet.publicKey });

    try {
        if(transaction) {
            transaction.update({ senderWallet: wallet, receiver, amount });
        } else {
            transaction = wallet.createTransaction({ 
                receiver, 
                amount, 
                chain: blockchain 
            });
        }
    } catch (error) {
        return res.status(400).json({ type: 'error', message: error.message });
    }

    transactionPool.setTransaction(transaction);
    pubsub.broadcastTransaction(transaction);
    res.json({ type: 'success', transaction });
});

app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', (req, res) => {
    transactionMiner.mineTransactions();

    res.redirect('/api/blocks');
});

app.get('/api/wallet/info', (req, res) => {
    const address = wallet.publicKey;
    
    res.json({
        address: address,
        balance: Wallet.calculateBalance({
            chain: blockchain.chain,
            address: address
        })
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const syncWithRootState = () => {
    request({ url: `${ROOT_NODE_ADDRESS}/api/blocks`}, (error, response, body) => {
        if(!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);

            console.log('replace chain on sync with', rootChain);
            blockchain.replaceChain(rootChain);
        }
    });

    request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map`}, (error, response, body) => {
        if(!error && response.statusCode === 200) {
            const rootTransactionPoolMap = JSON.parse(body);

            console.log('replace transaction pool map on sync with, ', rootTransactionPoolMap);
            transactionPool.setMap(rootTransactionPoolMap);
        }
    });
};

if(isDevelopment) {
    const walletFoo = new Wallet();
    const walletBar = new Wallet();
    
    const generateWalletTransaction = ({ receiver, amount}) => {
        const transaction = wallet.createTransaction({
            receiver, amount, chain: blockchain.chain
        });
    
        transactionPool.setTransaction(transaction);
    };
    
    const walletAction = () => generateWalletTransaction({
        wallet, receiver: walletFoo.publicKey, amount: 5
    });
    
    const walletFooAction = () => generateWalletTransaction({
        wallet: walletFoo, receiver: walletBar.publicKey, amount: 10
    });
    
    const walletBarAction = () => generateWalletTransaction({
        wallet: walletBar, receiver: wallet.publicKey, amount: 15
    });
    
    for(let i=0; i<10; i++) {
        if(i%3 == 0) {
            walletAction();
            walletFooAction();
        } else if(i%3 == 1) {
            walletAction();
            walletBarAction();
        } else {
            walletFooAction();
            walletBarAction();
        }
    
        transactionMiner.mineTransactions();
    }
}


let PEER_PORT;

if(process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;

app.listen(PORT, () => {
    console.log(`Application is listening at localhost:${PORT}`);
    if(PORT != DEFAULT_PORT)
        syncWithRootState();
});
# Groove-Chain
### A blockchain based peer-peer currency 
----

This is a cryptocurrency model which runs on localhost, and provides peer-peer transaction facility along with a mining functionality. The application is used over various API endpoints, as described below.

----
### *1. Blocks end-point*
`localhost:PORT/api/blocks`

This is a GET end-point which will return the blockchain in its current longest instance.

```
{
    timestamp: 1,
    lastHash: '-----',
    hash: 'g3n3515-#45#',
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    data: []
}
```
----
### *2. Mine end-point*
`localhost:PORT/api/mine`

This is a test END point to check implementation of block addition to the blockchain.

----
### *3. Transact end-point*
`localhost:PORT/api/transact`

This POST end point takes in a JSON Map of a transaction consisting of a `receiver` and an `amount`.

```
{
    "receiver": "receiver-pu8l1c-k3y",
    "amount": 10
}
```
----
### *4. Transaction-pool-map end-point*
`localhost:PORT/api/transaction-pool-map`

This GET endpoint will return a JSON Map of the un-mined transactions in the current state of TransactionPoolMap.

----
### *5. Mine-transactions end-point*
`localhost:PORT/api/mine-transactions`

This GET endpoint facilitates the mining functionality of the peers in the network. Each call of `api/mine-transactions` calls five underlying functions that verify the transactions, add them to a list to validate, perform the proof-of-work, add a new block to the blockchain, and sebsequently add a reward transaction for the miner.

----
### *6. Wallet-info end-point*
`localhost:PORT/api/wallet-info`

This GET end-point returns a JSON Map consisting of the publicKey (address), and balance of the current wallet instance of the node.

```
{
    "address": "m1n3r-4ddr355",
    "balance": 1000
}
```
----
## Validation Protocols

- Prevent sending groove-coins to yourself, in order to gain a reward.

- Prevent mining an empty transaction pool (a security flaw had enabled users to gain reward by mining an empty pool of transactions)

- validTransaction() method which checks multiple parameters of a transaction such as amount validation and signature validation.

- validTransactions() method which validates all the transactions present in the current instance of transactionPoolMap using the validTransaction() method, and returns a list of valid transactions, which are ready to mine.

- validTransactionData() method takes the current blockchain instance as an argument, and checks for illegitimate data. The checks it performs on the chain are:
    
    1. There should be only one reward transaction per mine request.
    2. Miner reward has to be equal to the MINING_REWARD which has been hard-coded.
    3. Calls validTransaction() for every transaction present in each block of the blockchain.
    4. It re-calulates the wallet balance to detect anomalies.
    5. It checks for invalid input amounts which signify an illegitimate transaction.
    6. Checks for repeated transactions which may be present in the pool.

    After all these checks are made, is the transaction added to the transaction pool.

- isChainValid() method which also takes the current blockchain instance as input, and verifies for accuracy, for parameters of lastHash, hash, and also modifies the difficulty as per the mine-rate.

----

## How to use

### Pre-requisites

- You must be on a Linux / MacOS machine.
- You must have Node installed on your machine.
- You must have Git installed.

### Recommendations

- You will require Postman / cURL to make post requests to the API.

### Steps

1. cd to the directory of your choice.
```
$ cd directory/
```
2. clone the repo onto your machine.
```
$ git clone https://github.com/vedaantBali/groove-chain
```
3. cd into `groove-chain`
```
$ cd groove-chain/
```
4. Install the node dependencies 
```
$ npm install
```

Once this is done, you are setup to start an instance of Groove-chain on your machine.

1. Run the main instance in the terminal.
```
$ npm run dev
``` 
2. Run any number of peers in another terminal tab.
```
$ npm run dev-peer
```
The dev-peer script assigns random ports to the peers, in the range of 3001 to 4000

----

## Sending and receiving transactions and data
You must have an instance of the application open in a terminal.

----
### - With cURL

1. Open a new terminal window, and make a GET request to the `api/wallet-info` end-point
```
$ curl http://localhost:3000/api/wallet-info
```
you will receive a JSON map with the wallet info
```
{    "address":"04dc3b9fd745cb9bfb8174797c49eefbd780f024e066278e6e1b83b94833be568d8fc641ff352409d15e93fcc1d857dd44b507c177624910a2cacfee75af2400b4",
"balance":1000
}
```
This is your public key. Anyone on the network who wants to send groove-coins to you will require your public key. Similarly, you can implement other get requests by changing the end point.

2. To send groove-coins, head over to another terminal and create a POST request. The `receiver` field will consist of the public key of the wallet to which you want to send groove-coins.

```
$ curl -X POST -H "Content-Type: application/json" -d /
'{"receiver": "04dc3b9fd745cb9bfb8174797c49eefbd780f024e066278e6e1b83b94833be568d8fc641ff352409d15e93fcc1d857dd44b507c177624910a2cacfee75af2400b4", 
"amount": 150
}' http://localhost:3952/api/transact
```

You will receive a confirmation along with the current transaction pool
```
{"type":"success","transaction":{"id":"babc47f0-d50b-11eb-9bbc-d14b7e4861f6","outputMap":{"04dc3b9fd745cb9bfb8174797c49eefbd780f024e066278e6e1b83b94833be568d8fc641ff352409d15e93fcc1d857dd44b507c177624910a2cacfee75af2400b4":150,"0413cba645cfa0c17cd527614b717746c3e5fed8a23a3919273a542ddb13d93586bab8eb72e5b3c2e5ab34c5e6531558dd1ae536c933cc00253446230e84938fce":850},"input":{"timestamp":1624553191920,"amount":1000,"address":"0413cba645cfa0c17cd527614b717746c3e5fed8a23a3919273a542ddb13d93586bab8eb72e5b3c2e5ab34c5e6531558dd1ae536c933cc00253446230e84938fce","signature":{"r":"77dd92e08aaff8648dc0cd1552d5f11afc001c2bea990c02542666c49a244ef1","s":"341123378c5fe59734a800654625a2f8436534da7e6f1963c355913cbc85ae1a","recoveryParam":1}}}}
```
3. To mine the current transactions present in the transaction pool, head to the api/mine-transactions GET end-point
```
$ curl http://localhost:3000/api/mine-transactions
```
The transactions will be mined and you will be redirected to api/blocks to show the current state of the blockchain. You will also receive a 50 groove-coin reward for mining the transactions.
```
replacing chain with  [
  {
    timestamp: 1,
    lastHash: '-----',
    hash: 'g3n3515-#45#',
    data: [],
    nonce: 0,
    difficulty: 3
  },
  {
    timestamp: 1624553431084,
    lastHash: 'g3n3515-#45#',
    hash: '22c24243110bf7ac947c038295ddc0e59b1a5cb3da95a320de4352b7ee86c74a',
    data: [ [Object], [Object] ],
    nonce: 6,
    difficulty: 2
  }
]
```
As you can see, a new block has been added to the blockchain, after the GENESIS BLOCK

----
### In case the port 3000 appears to be in use, run the shell script labeled as fix_port.sh which is present in the root of the directory.


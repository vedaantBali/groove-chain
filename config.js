const MINE_RATE = 1000;
const INITIAL_DIFFICULTY = 3;
const STARTING_BALANCE = 1000;
const MINING_REWARD = 50;

const REWARD_INPUT = {
    address: '*authorized-reward*'
};

const GENESIS_DATA = {
    timestamp: 1,
    lastHash: '-----',
    hash: 'g3n3515-#45#',
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    data: []
};

module.exports = { 
    GENESIS_DATA, 
    MINE_RATE, 
    STARTING_BALANCE, 
    REWARD_INPUT, 
    MINING_REWARD 
};
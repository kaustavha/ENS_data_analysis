// import { default as Web3} from 'web3';

// // ENS CODE
// import { default as abiDecoder } from 'abi-decoder'

var Web3 = require('web3'),
	abiDecoder = require('abi-decoder'),
	ens_artifacts = require('../app/resources/ensAbi.json');

// var tmin = 3327417,
// // var tmin = 4542749-10000,
//     tmax = 4542749;

var tmin = 2224600,
    tmax = 4581531;

var net = require('net');

var web3 = new Web3(Web3.givenProvider || new Web3.providers.HttpProvider("http://localhost:8545"));


web3 = new Web3("/Users/kaustavhaldar/Library/Ethereum/geth.ipc", net);

var ensAddress = "0x6090A6e47849629b7245Dfa1Ca21D94cd15878Ef".toLowerCase();
var ensContract = new web3.eth.Contract(ens_artifacts, ensAddress);

abiDecoder.addABI(ens_artifacts);
var unsealBidMethodHash = "0x47872b42".toLowerCase(); // check this against tx.input
var stateMap = [
  ["BidTooLateOrLow", 995], 
  ["Owned", 5], 
  ["NewWinner", 995], 
  ["IncreaseValue", 995], 
  ["DoesntAffect", 995]
];

// config ES
var ES = require('elasticsearch');
var client = new ES.Client({
  host: 'localhost:9200', 
  log: 'trace'
});

var isValid = (txObj) => {
      if (txObj.to 
          && (txObj.to.toLowerCase() == ensAddress 
          || txObj.from.toLowerCase() == ensAddress) 
          && txObj.input.toLowerCase().indexOf(unsealBidMethodHash) == 0) {
        return true;
      }
      return false;
  }

var txList = {};

var getTxReceipt = (txHash, cb) => {
    console.log("getTxReceipt", txHash);
    web3.eth.getTransactionReceipt(txHash, (e, txRObj) => {
        let decodedLogs = abiDecoder.decodeLogs(txRObj.logs),
            txInputs = abiDecoder.decodeMethod(txObj.input);
        if (txList[txHash]) {
          console.log("found hash already");
          console.log(txList[txHash]);
        } else {
          txList[txHash] = {
            decodedLogs: '',
            receipt: '',
            inputs: ''
          }
        }
        txList[txHash].decodedLogs = decodedLogs;
        txList[txHash].receipt = txRObj;
        txList[txHash].inputs = txInputs;
        // inProgress--;
        // getTxData(txRObj, cb);
        cb();
    });
  }

function populate(cb) {
  web3.eth.getBlockNumber().then((num) => {
    getBlockWrap(num, cb);
  });
}

function getBlockWrap(num, cb) {
  console.log(num);
  if (num <= tmin) return cb(); // at smallest local block
  var batch = new web3.BatchRequest();
  for (var i = 10; i > 0; i--) {
    batch.add(getBlock(num--));
    // num--;
  }
  batch.execute();
  console.log(num);
  getBlockWrap(num, cb);
}

function getBlock(num) {
    web3.eth.getBlock(num, true).then((blockObj) => {
      if (!blockObj || !blockObj.transactions) return;
      blockObj.transaction.map((ele, i, arr) => {
        if (isValid(ele)) {
          getTxReceipt(ele);
        }
      });
    });
}


var i = 0;
console.log("Started: Using web3 version: ", web3.version);
// lets do 2 days 1st, 4542749 is where geths at
// so 2 days prolly 

function events() {
  let ev = ensContract.getPastEvents("BidRevealed", {fromBlock: tmin, toBlock: tmax}, (e,i) => {
    console.log(e,i);
  }).then(console.log('eh'));
}

function pushToES(ele) {
  console.log(ele);
  if (!ele || !ele.blockHash) return;
  client.create({
    index: "ENS",
    type: "ensBidRevealed",
    id: ele.blockHash,
    body: ele
  }, () => {
    console.log(i++);
  });
}

// populate(events);
// getBlockWrap(tmax, events)

let eventsVar = ensContract.getPastEvents("BidRevealed", {fromBlock: tmin, toBlock: tmax}, (ele, arr) => {
  console.log("started");
  console.log(ele, arr);
  pushToES(ele);
});

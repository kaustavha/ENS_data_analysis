

// import { default as Web3} from 'web3';

// // ENS CODE
// import { default as abiDecoder } from 'abi-decoder'

var Web3 = require('web3'),
  abiDecoder = require('abi-decoder'),
  ens_artifacts = require('../app/resources/ensAbi.json');

// var tmin = 3327417,
  // tmax = 'latest';
// var tmin = 4571864,
// tmax = 4534834;

var tmin = 3327417,
    tmax = 4581196;

var c1 = 0, c2 = 0;

var inProgress = 0;

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
// console.log(web3);
// import ens_artifacts from '../resources/ensAbi.json'
var ensAddress = "0x6090A6e47849629b7245Dfa1Ca21D94cd15878Ef".toLowerCase();
var ensContract = new web3.eth.contract(ens_artifacts).at(ensAddress);
// , {from: account});
// var acc = web3.eth.getAccounts();

abiDecoder.addABI(ens_artifacts);
var unsealBidMethodHash = "0x47872b42".toLowerCase(); // check this against tx.input
var stateMap = [
  ["BidTooLateOrLow", 995], 
  ["Owned", 5], 
  ["NewWinner", 995], 
  ["IncreaseValue", 995], 
  ["DoesntAffect", 995]
];

var Ens = {
  txList: {},
  eventLogs: [],
  txReciepts: [],
  decoded: {},
  getAcc: (cb) => {
    web3.eth.getAccounts((e,id)=>{ 
      if (e) console.log(e);
      cb(id);
    });
  },
  test: function(to, from) {
    this.getEventLogs(to, from);
    this.iterFetch(to, from);
    this.loadToWindow();
  },
  collect: function(obj) {

    // txList.push(obj); // retrofit w/ ES and Kibana later


  },
  procOne: function(block) {

  },
  iterFetch: function(min, max) {
    console.log("Starting iterfetch w/ min & max = ", min, max);
    if (max == 'latest') {
      web3.eth.getBlockNumber((e,i) => {
        console.log(e,i);
        this._iterFetch(min, i);
      });
    } else {
      this._iterFetch(min, max);
    }
  },
  _batchFetch: function(blockNum) {
    let batch = web3.createBatch();

    for (var i = 0; i < 10; i++) {
      batch.add(web3.eth.getBlock.request(blockNum, true, (err, obj) => {
        this.txList[blockNum] = obj;
      }));

      blockNum--;
    }

    batch.execute();

    console.log(this.txList);
    console.log("_batchFetch");
    // let x = 10;
    // while (x > 0) {
    //   console.log(x, blockNum);
    //   let cb = function() {
    //     console.log(blockNum, x);

    //   }
    //   this.getBlock(blockNum, cb);
    //   blockNum--;
    //   x--;
    // }
    console.log("bb", blockNum)
    setTimeout(this._batchFetch(blockNum), 10000);
  },
  // _batchFetch: function(blockNum) {
  //   var x = 10;
  //   var self = this;
  //   for (var i = blockNum; i > blockNum-10; i--) {
  //     self.getBlock(i, ()=>{
  //       console.log(i);
  //       x--;
  //       if (x==0) console.log(x, "yo");
  //     });
  //   }
  // },
  _iterFetch: function(min, max) {
    console.log("_iterFetch", min, max);
    for (var i = max; i > min; i--) {
      console.log(i);
      web3.eth.getBlock(i, true, (err, blockObj) => {
        console.log(blockObj);
        if (!blockObj || !blockObj.transactions) return;
        // console.log("gotblock ", blockObj.transactions);
        blockObj.transactions.map((ele, j) => {
          if (this.isValid(ele)) {
            
          console.log("ele", ele)
              this.getTxReceipt(ele);
          }

        });
      });

    }
  },
  getBlock: function(i, cb)  {
      web3.eth.getBlock(i, true, (err, blockObj) => {
        console.log(blockObj);
        if (!blockObj || !blockObj.transactions) return;
        // console.log("gotblock ", blockObj.transactions);
        blockObj.transactions.map((ele, j) => {
          if (this.isValid(ele)) {
              
          console.log("ele", ele)
              this.getTxReceipt(ele, cb);
          } else {
            cb(true);
          }
        });
      });
  },
  isValid: (txObj) => {
      if (txObj.to 
          && (txObj.to.toLowerCase() == ensAddress 
          || txObj.from.toLowerCase() == ensAddress) 
          && txObj.input.toLowerCase().indexOf(unsealBidMethodHash) == 0) {
        return true;
      }
      return false;
  },
  getTxReceipt: function(txHash, cb) {
    console.log(txHash);
    web3.eth.getTransactionReceipt(txHash, (e, txRObj) => {
        let decodedLogs = abiDecoder.decodeLogs(txRObj.logs),
            txInputs = abiDecoder.decodeMethod(txObj.input);
        if (this.txList[txHash]) {
          console.log("found hash already");
          console.log(this.txList[txHash]);
        } else {
          this.txList[txHash] = {
            decodedLogs: '',
            receipt: '',
            inputs: ''
          }
        }
        console.log(decodedLogs.length, txRObj);
        this.txList[txHash].decodedLogs = decodedLogs;
        this.txList[txHash].receipt = txRObj;
        this.txList[txHash].inputs = txInputs;
        this.getTxData(txRObj, cb);
        cb();
    });
  },
  getTxData: function(txObj, cb) {
    // decode tx data
    let txInputs = abiDecoder.decodeMethod(txObj.input),
        txLogs = abiDecoder.decodeLogs(txObj.logs);

  },
  getEventLogs: function(from, to) {

    var instance;
    // Ens.deployed().then((inst) => {
      // instance = inst;
      let BidRevealedEvent = ensContract.BidRevealed({}, {fromBlock: from, toBlock: to});
      BidRevealedEvent.get((err, logs) => {
        console.log(err, logs);
        this.eventLogs = logs;
        console.log(logs);
      });
    // });
    // 
    // const filter = web3.eth.filter({fromBlock: 0, toBlock: 'latest', address: "0x6090A6e47849629b7245Dfa1Ca21D94cd15878Ef", topics: [web3.sha3('NewBid(bytes32,address,uint)')]})
  },
  // getFilteredEventLogs: function(from, to) {
  //   const filter = web3.eth.filter({fromBlock: from, toBlock: to, address: ensAddress, topics: [web3.sha3('NewBid(bytes32,address,uint)')]})
  //  console.log(filter);
  // }
}

// Ens.getFilteredEventLogs(tmin, tmax);

console.log("starting");
// Ens.iterFetch(tmin, tmax);
// Ens._batchFetch(tmax);
Ens.iterFetch(tmin. tmax);
Ens.getEventLogs(tmin, tmax);

// import { default as Web3} from 'web3';

// // ENS CODE
// import { default as abiDecoder } from 'abi-decoder'

var Web3 = require('web3'),
	abiDecoder = require('abi-decoder'),
	ens_artifacts = require('../app/resources/ensAbi.json');

var tmin = 3327417,
	tmax = 'latest';

var c1 = 0, c2 = 0;

var inProgress = 0;

// var web3 = new Web3(new Web3.providers.IpcProvider("/Users/kaustavhaldar/Library/Ethereum/geth.ipc"));
var web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
// console.log(web3);
// import ens_artifacts from '../resources/ensAbi.json'
var ensAddress = "0x6090A6e47849629b7245Dfa1Ca21D94cd15878Ef".toLowerCase();
var ensContract = new web3.eth.contract(ens_artifacts).at(ensAddress);
// , {from: account});
// var acc = web3.eth.getAccounts();

abiDecoder.addABI(ens_artifacts);
var unsealBidMethodHash = "0x47872b42".toLowerCase(); // check this against tx.input
var stateMap = [
  ["BidTooLateOrLow", 995], 
  ["Owned", 5], 
  ["NewWinner", 995], 
  ["IncreaseValue", 995], 
  ["DoesntAffect", 995]
];

var Ens = {
  txList: {},
  eventLogs: [],
  txReciepts: [],
  decoded: {},
  getAcc: (cb) => {
    web3.eth.getAccounts((e,id)=>{ 
      if (e) console.log(e);
      cb(id);
    });
  },
  test: function(to, from) {
    this.getEventLogs(to, from);
    this.iterFetch(to, from);
    this.loadToWindow();
  },
  collect: function(obj) {
    // txList.push(obj); // retrofit w/ ES and Kibana later


  },
  procOne: function(block) {

  },
  iterFetch: function(min, max) {
    if (max == 'latest') {
      web3.eth.getBlockNumber((e,i) => {
        this._iterFetch(min, i);
      });
    } else {
      this._iterFetch(min, max);
    }
  },
  _batch: function(max) {
    for (var i = max; i > 0; i++) {
      max[i];
    }
  },

  _iterFetch: function(min, max) {
    for (var i = min; i < min+10; i++) {
      inProgress++;
      // if (inProgress > 50) {
      //   while (inProgress > 40) {

      //     // yield setTimeout(suspend.resume(), 1000);
      //   }
      // }
      // if (x==50) break;
      // console.log("iterfetch ", i);
      web3.eth.getBlock(i, true, (err, blockObj) => {
        // console.log(blockObj);
        if (!blockObj || !blockObj.transactions) return;
        console.log("gotblock ", blockObj.transactions);
        blockObj.transactions.map((ele, j) => {
          if (isValid(ele)) {
              this.getTxReceipt(ele);
              // this.collect
          }

          // console.log("")
          // if (!ele.to) c2++;
          // if (ele) this.getEnsTxs(ele);
        });
      });
    }
  },
  isValid: (txObj) => {
      if (txObj.to 
          && (txObj.to.toLowerCase() == ensAddress 
          || txObj.from.toLowerCase() == ensAddress) 
          && txObj.input.toLowerCase().indexOf(unsealBidMethodHash) == 0) {
        return true;
      }
      return false;
  },
  getBlock: (blockN, cb) => {
    if (!blockN) return cb(true);

    function finalCb() {
      return cb();
    }

    web3.eth.getBlock(blockN, (err, blockObj) => {
      if (!blockObj || !blockObj.transactions) return cb(true);

    });
  },
  getEnsTxs: (txHashArr, cb) => {
    var count = txHashArr.length;
    // for () {}
    function fcb() {
      if (txHashArr.length > 0) {
        let txHashArrNew = txHashArr.shift();
        this.getEnsTxs(txHashArrNew[0], fcb);
      } else {
        cb();
      }
    }
    this.getEnsTx(txHashArr[0], fcb);
  },
  getEnsTx: (txHash, cb) => {
    web3.eth.getTransaction(txHash, (e, txObj) => {
      // console.log(e, txObj);
      // if (e) console.log(e);
      // if (!txObj.to){ console.log(txObj); c2++; return; }
      if (this.isValid(txObj)) {
      // if (txObj.to.toLowerCase() == ensAddress || txObj.from.toLowerCase() == ensAddress) {
        console.log("found ens add ");
        if (txObj.input.toLowerCase().indexOf(unsealBidMethodHash) == 0) {
          // this.collect(txObj);
          console.log("ubid found");
          let txInputs = abiDecoder.decodeMethod(txObj.input);
          if (this.txList[txHash]) console.log("found again", txHash, this.txList);
          this.txList[txHash] = {'id': txHash, 'receipt': '', 'txObj': txObj, decodedInput: txInputs, decodedLogs: ''};
          this.getTxReceipt(txHash, cb);
        }
      }
    });
  },
  getTxReceipt: function(txHash, cb) {
    console.log("getTxReceipt", txHash);
    web3.eth.getTransactionReceipt(txHash, (e, txRObj) => {
        let decodedLogs = abiDecoder.decodeLogs(txRObj.logs),
            txInputs = abiDecoder.decodeMethod(txObj.input);
        if (this.txList[txHash]) {
          console.log("found hash already");
          console.log(this.txList[txHash]);
        } else {
          this.txList[txHash] = {
            decodedLogs: '',
            receipt: '',
            inputs: ''
          }
        }
        this.txList[txHash].decodedLogs = decodedLogs;
        this.txList[txHash].receipt = txRObj;
        this.txList[txHash].inputs = txInputs;
        inProgress--;
        // getTxData(txRObj, cb);
        cb();
    });
  },
  getTxData: function(txObj, cb) {
    // decode tx data
    let txInputs = abiDecoder.decodeMethod(txObj.input),
        txLogs = abiDecoder.decodeLogs(txObj.logs);

  },
  getEventLogs: function(from, to) {

    var instance;
    // Ens.deployed().then((inst) => {
      // instance = inst;
      let BidRevealedEvent = ensContract.BidRevealed({}, {fromBlock: from, toBlock: to});
      BidRevealedEvent.get((err, logs) => {
        console.log(err, logs);
        this.eventLogs = logs;
        console.log(logs);
      });
    // });
    // 
    // const filter = web3.eth.filter({fromBlock: 0, toBlock: 'latest', address: "0x6090A6e47849629b7245Dfa1Ca21D94cd15878Ef", topics: [web3.sha3('NewBid(bytes32,address,uint)')]})
  },
  // getFilteredEventLogs: function(from, to) {
  //   const filter = web3.eth.filter({fromBlock: from, toBlock: to, address: ensAddress, topics: [web3.sha3('NewBid(bytes32,address,uint)')]})
  // 	console.log(filter);
  // }
}

// Ens.getFilteredEventLogs(tmin, tmax);

Ens.iterFetch(tmin, tmax);


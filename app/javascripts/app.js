// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'
// Import our contract artifacts and turn them into usable abstractions.
import metacoin_artifacts from '../../build/contracts/MetaCoin.json'
// MetaCoin is our usable abstraction, which we'll use through the code below.
var MetaCoin = contract(metacoin_artifacts);
// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;


// ENS CODE
import { default as abiDecoder } from 'abi-decoder'

import ens_artifacts from '../resources/ensAbi.json'
var ensAddress = "0x6090A6e47849629b7245Dfa1Ca21D94cd15878Ef".toLowerCase();
var Ens = new web3.eth.contract(ens_artifacts).at(ensAddress);
// , {from: account});
abiDecoder.addABI(ens_artifacts);
var unsealBidMethodHash = "0x47872b42".toLowerCase(); // check this against tx.input
var stateMap = [
  ["BidTooLateOrLow", 995], 
  ["Owned", 5], 
  ["NewWinner", 995], 
  ["IncreaseValue", 995], 
  ["DoesntAffect", 995]
];


    var c1 = 0, c2 = 0;
// two ways
// 1: bind ENS ABI and listen for events, listen for 2 days then send -> same as after
// 2: iteratively look through old blocks, look through tx and collect all that are to the ens.
// lots of data to go through, ~500k blocks, 

// Alternative -> just get events log from ENS, unsealbid fires eventusually
window.Ens = {
  txList: {},
  eventLogs: [],
  txReciepts: [],
  decoded: {},
  test: function(to, from) {
    this.getEventLogs(to, from);
    this.iterFetch(to, from);
    this.loadToWindow();
  },
  loadToWindow: function() {
    window.ensObj = Ens;
    window.txList = this.txList;
    window.eventLogs = this.eventLogs;
  },
  collect: function(obj) {
    // txList.push(obj); // retrofit w/ ES and Kibana later

  },
  iterFetch: function(min, max) {
    for (var i = min; i < max; i++) {
      console.log("iterfetch ", i);
      web3.eth.getBlock(i, (err, blockObj) => {
        c1++;
        console.log("gotblock ", blockObj.transactions);
        blockObj.transactions.map((ele, j) => {
          // console.log("")
          // if (!ele.to) c2++;
          if (ele) this.getEnsTxs(ele);
        });
      });
    }
  },
  getEnsTxs: function(txHash) {
    console.log(txHash);
    web3.eth.getTransaction(txHash, (e, txObj) => {
      console.log(e, txObj);
      if (e) console.log(e);
      if (!txObj.to){ console.log(txObj); c2++; return; }
      if (txObj.to.toLowerCase() == ensAddress || txObj.from.toLowerCase() == ensAddress) {
        console.log("found ends add");
        if (txObj.input.toLowerCase().indexOf(unsealBidMethodHash) == 0) {
          // this.collect(txObj);
          console.log("ubid found");
          let txInputs = abiDecoder.decodeMethod(txObj.input);
          if (this.txList[txHash]) console.log("found again", txHash, this.txList);
          this.txList[txHash] = {'id': txHash, 'receipt': '', 'txObj': txObj, decodedInput: txInputs, decodedLogs: ''};
          this.getTxReceipt(txHash);
        }
      }
    });
  },
  getTxReceipt: function(txHash) {
    console.log(txHash);
    web3.eth.getTransactionReceipt(txHash, (e, txRObj) => {
        let decodedLogs = abiDecoder.decodeLogs(txRObj.logs);
        this.txList[txHash].decodedLogs = decodedLogs;
        this.txList[txHash].receipt = txRObj;
    });
  },
  getTxData: function(txObj) {
    // decode tx data
    let txInputs = abiDecoder.decodeMethod(txObj.input),
        txLogs = abiDecoder;

  },
  getEventLogs: function(from, to) {
    var instance;
    // Ens.deployed().then((inst) => {
      // instance = inst;
      let BidRevealedEvent = Ens.BidRevealed({}, {fromBlock: from, toBlock: to});
      BidRevealedEvent.get((err, logs) => {
        console.log(err, logs);
        this.eventLogs = logs;
        window.BREerr = err;
        window.BRElogs = logs;
      });
    // });
    // 
    // const filter = web3.eth.filter({fromBlock: 0, toBlock: 'latest', address: "0x6090A6e47849629b7245Dfa1Ca21D94cd15878Ef", topics: [web3.sha3('NewBid(bytes32,address,uint)')]})
  }
}


// old meta coin code
window.App = {
  start: function() {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    MetaCoin.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      self.refreshBalance();
    });
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  refreshBalance: function() {
    var self = this;

    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.getBalance.call(account, {from: account});
    }).then(function(value) {
      var balance_element = document.getElementById("balance");
      balance_element.innerHTML = value.valueOf();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting balance; see log.");
    });
  },

  sendCoin: function() {
    var self = this;

    var amount = parseInt(document.getElementById("amount").value);
    var receiver = document.getElementById("receiver").value;

    this.setStatus("Initiating transaction... (please wait)");

    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.sendCoin(receiver, amount, {from: account});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshBalance();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  }
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }
  // Ens.setProvider(web3.currentProvider);
  App.start();
});

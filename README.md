# README

In the non-ethereum internet, we have the DNS. The DNS isnt very transparent. Neither are a lot of the ICOs happening on Ethereum right now. I want to fix and improve that by:
 - offer a visualization platform for activity related to the ENS
 - track, record and archive these events and activites
 - thus increase the number of data points we can use to evaluate new financial opportunities on ethereum
 
The ENS has been in service for close to a year now, and the top 3 names have >50k Eth locked up in them. 

We can use this tool to visualize the economic disparity of domain name purchases. 
Detect hoarders of domain names, thus perhaps busting unscrupoulous founders with multiple projects that dont progress but act more for marketing their brand. 
Alternatively we can reward good founder, this provides a positive data point showing duration of engagement in this ecosystem. 

This is an attempt to visualize and graph data coming in from the blockchain, specifically the ENS and it's bid reveal event. This is a minimal PoC which only looks at BidReveal event coming out of the unsealBid() function in ENS. 

## High level overview

ENS is a distributed domain registrar on the ethereum blockchain/vm.
An ethereum node mines and broadcasts txs and can be run by anyone
Running a fullnode makes us privy to some information and we can use that,
record it. 
In the case where we dont have the blockchain or dont want to get the full one we can traverse like so:
Block {'latest'} -> block.transactions -> Get txs for each of the tx hashes in this list -> forEach get txReceipt -> evaluate txReceipt, checking to address and inputs to be what we're monitoring. 

## Quick start  

 To get events from the EVM we can't use infura since they'd be susceptible to DOS attacks if they enable the event monitoring and filtering abilities of geth/parity. So no web3 w/ metamask on the front. 

 Although there is a frontend app, in `/app` that will bypass this limitation at the cost of vastly more processing power while being sandboxed and bounded by Chrome. 
 You can think of this as a way to explore data with greater freedom. 

```
// install metamask plugin for browser.
// you can stay on mainnet since we only retrieve data without changing contract state, so its free

npm install
truffle compile
truffle migrate
npm run dev
 ```

Now for the main app:
Since the purpose as I saw it was to better visualize and understand data and not just make a pretty frontend, this application uses some secondary software tools:

You'll need docker installed and one of the ehtereum core clients, ideally geth or parity.  

```
brew install docker
brew install geth
```

You can now simply run `docker-compose up` to spin up the services, working configuration is built in for most use cases. 

This will spin up:
- An ElasticSearch cluster @ localhost:9200 <- Used to hold events data coming in, used due to it's speed and flexibility, useful for data analysis
- A kibana cluster @ localhost@5601 <- This is our main frontend and visualizer used to chart the data and attempt to understand it.

Make sure you have geth or parity with most of the blocks synced at this pt or the script wont work. This can take 4-8hrs. And may make you run out disk space...
```
geth --rpc --fast --cache=1024
// Now make sure youre connected to peers and have some blocks from another window
geth attach
eth.syncing
{
  currentBlock: 2008090,
  highestBlock: 4581366,
  knownStates: 4325903,
  pulledStates: 4314472,
  startingBlock: 1013790
}
net.peerCount
1
```
Karalabe mentions that here as well: https://github.com/ethereum/web3.js/issues/1093


To load the ENS related events into ES run:  
``` 
node server2/index.js 
```  
Alternatively `node server/server.js` can improve chain sync time by increasing demand by traversing blocks and asking for targeted txReceipts. 


### TODO:

- Instantiate this project in an environment with enough space to pull down the entire blockchain
- Try this with parity, perhaps that'll save space. 
- Create more kibana charts
- Implement strong swarm over the cluster nodes allowing them to talk more securely. 
	At that point we can open up the enviroment to other's interested in the data and insights and be certain their applications wont be able to spy on each other or the core. 
- Add a web admin dashboard for ES like elasticsearch-kopf

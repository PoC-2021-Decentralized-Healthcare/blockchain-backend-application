# blockchain-backend-application

cd ~/fabric-samples/test-network;

./network.sh down;

./network.sh up createChannel -c mychannel -ca;

./network.sh deployCC -ccn basic -ccp ../blockchain-backend-application/chaincode/ -ccl javascript;

rm ~/fabric-samples/blockchain-backend-application/application/src/controller/wallet/*

cd ~/fabric-samples/blockchain-backend-application/application

node server.js

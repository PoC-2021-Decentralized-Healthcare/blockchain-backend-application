/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('./CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('./AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';
const org2UserId = 'doctorUser';

const gateway = new Gateway();

function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
}


const enrolllUser = async (req, res) => {
    try {

        // build an in memory object with the network configuration (also known as a connection profile)
        const ccp = buildCCPOrg1();

        // build an instance of the fabric ca services client based on
        // the information in the network configuration
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

        // setup the wallet to hold the credentials of the application user
        const wallet = await buildWallet(Wallets, walletPath);

        // in a real application this would be done on an administrative flow, and only once
        await enrollAdmin(caClient, wallet, mspOrg1);

        // in a real application this would be done only when a new user was required to be added
        // and would be part of an administrative flow
        await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

        await registerAndEnrollUser(caClient, wallet, mspOrg1, org2UserId, 'org1.department1');


        res.status(200).send("User registered and enrolled");

    } catch (err) {

        console.log(err);

        res.status(500).send({
            message: "Unable to register and enroll user!",
        });

    }
};


const transferAsset = async (req, res) => {



    // build an in memory object with the network configuration (also known as a connection profile)
    const ccp = buildCCPOrg1();


    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(Wallets, walletPath);

    try {
        // setup the gateway instance
        // The user will now be able to create connections to the fabric network and be able to
        // submit transactions and query. All transactions submitted by this gateway will be
        // signed by this user using the credentials stored in the wallet.
        await gateway.connect(ccp, {
            wallet,
            identity: org1UserId,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);


        const asset = {
            ID: 'asset1',
            Color: 'blue',
            Size: 5,
            Owner: 'Tomoko',
            AppraisedValue: 350,
        }

        console.log('\n--> Submit Transaction: UpdateAsset asset1, change the appraisedValue to 350');
        await contract.submitTransaction('UpdateAssetV2', asset);
        //await contract.submitTransaction('UpdateAsset', 'asset1', 'blue', '5', 'Tomoko', '350');

        console.log('*** Result: committed');

        console.log('\n--> Evaluate Transaction: ReadAsset, function returns "asset1" attributes');
        let result = await contract.evaluateTransaction('ReadAsset', 'asset1');
        console.log(`*** Result: ${prettyJSONString(result.toString())}`);

        res.status(200).send(prettyJSONString(result.toString()));

    } catch (err) {

        console.log(err);

        res.status(500).send({
            message: "Unable to GetAllAssets!",
        });

    } finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    }
};




const getAllAssets = async (req, res) => {



    // build an in memory object with the network configuration (also known as a connection profile)
    const ccp = buildCCPOrg1();


    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(Wallets, walletPath);

    try {
        // setup the gateway instance
        // The user will now be able to create connections to the fabric network and be able to
        // submit transactions and query. All transactions submitted by this gateway will be
        // signed by this user using the credentials stored in the wallet.
        await gateway.connect(ccp, {
            wallet,
            identity: org1UserId,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);

        // Let's try a query type operation (function).
        // This will be sent to just one peer and the results will be shown.
        console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
        let result = await contract.evaluateTransaction('GetAllAssets');
        console.log(`*** Result: ${prettyJSONString(result.toString())}`);

        res.status(200).send(prettyJSONString(result.toString()));

    } catch (err) {

        console.log(err);

        res.status(500).send({
            message: "Unable to GetAllAssets!",
        });

    } finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    }
};



const getAsset = async (req, res) => {


    console.log(req.params)

    // build an in memory object with the network configuration (also known as a connection profile)
    const ccp = buildCCPOrg1();


    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(Wallets, walletPath);

    try {
        // setup the gateway instance
        // The user will now be able to create connections to the fabric network and be able to
        // submit transactions and query. All transactions submitted by this gateway will be
        // signed by this user using the credentials stored in the wallet.
        await gateway.connect(ccp, {
            wallet,
            identity: org1UserId,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);

        console.log('\n--> Evaluate Transaction: ReadAsset, function returns "asset1" attributes');
        let result = await contract.evaluateTransaction('ReadAsset', req.params.assetId);
        console.log(`*** Result: ${prettyJSONString(result.toString())}`);

        res.status(200).send(prettyJSONString(result.toString()));

    } catch (err) {

        console.log(err);

        res.status(500).send({});

    } finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    }
};




const shareAsset = async (req, res) => {

    // build an in memory object with the network configuration (also known as a connection profile)
    const ccp = buildCCPOrg1();


    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(Wallets, walletPath);

    try {
        // setup the gateway instance
        // The user will now be able to create connections to the fabric network and be able to
        // submit transactions and query. All transactions submitted by this gateway will be
        // signed by this user using the credentials stored in the wallet.
        await gateway.connect(ccp, {
            wallet,
            identity: org1UserId,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);

        /*
        const asset = {
            ID: 'asset1',
            Color: 'blue',
            Size: 5,
            Owner: 'Tomoko',
            AppraisedValue: 350,
        }
        */
       
        let id = req.body.id
        let newOwner = req.body.newOwner


        console.log('\n--> Get Asset: ', id);
        let result = await contract.evaluateTransaction('ReadAsset', id);
        console.log(`*** Result: ${prettyJSONString(result.toString())}`);

        let resultObj = JSON.parse(result.toString())


        console.log('\n--> Submit Transaction: UpdateAsset {id}, change the appraisedValue to 350');
        await contract.submitTransaction('UpdateAssetV2', id, newOwner, resultObj.base64_asset);

        //await contract.submitTransaction('UpdateAsset', 'asset1', 'blue', '5', 'Tomoko', '350');

        console.log('*** Result: committed');

        console.log('\n--> Evaluate Transaction: ReadAsset, function returns "asset1" attributes');
        result = await contract.evaluateTransaction('ReadAsset', id);
        console.log(`*** Result: ${prettyJSONString(result.toString())}`);

        res.status(200).send(prettyJSONString(result.toString()));

    } catch (err) {

        console.log(err);

        res.status(500).send({
            message: "Unable to shareAsset!",
        });

    } finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    }
};


const createAsset = async (req, res) => {

    // build an in memory object with the network configuration (also known as a connection profile)
    const ccp = buildCCPOrg1();

    

    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(Wallets, walletPath);

    try {
        // setup the gateway instance
        // The user will now be able to create connections to the fabric network and be able to
        // submit transactions and query. All transactions submitted by this gateway will be
        // signed by this user using the credentials stored in the wallet.
        await gateway.connect(ccp, {
            wallet,
            identity: org1UserId,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);


        var uuid = require('uuid');


        // Now let's try to submit a transaction.
        // This will be sent to both peers and if both peers endorse the transaction, the endorsed proposal will be sent
        // to the orderer to be committed by each of the peer's to the channel ledger.
        console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, color, owner, size, and appraisedValue arguments');

        /*
        let id = uuid.v4()

        const asset = {
            ID: id,
            Color: 'blue',
            Size: 5,
            Owner: 'Tomoko',
            AppraisedValue: 300,
        }
        */

        console.log(req.body.id, req.body.base64_asset)

        //var base64_asset = Buffer.from(JSON.stringify(asset)).toString("base64");
        //var owner = 'Tomoko';
        //var assetObj = JSON.parse(Buffer.from(strAsset, 'base64').toString('ascii'))

        let result = await contract.submitTransaction('CreateAssetV2', req.body.id, req.body.owner, req.body.base64_asset);
        //let result = await contract.submitTransaction('CreateAsset', 'asset-' + uuid.v4(), 'yellow', '5', 'Tom', '1300');
        console.log('*** Result: committed');
        if (`${result}` !== '') {
            console.log(`*** Result: ${prettyJSONString(result.toString())}`);
        }

        res.status(200).send(prettyJSONString(result.toString()));

    } catch (err) {

        console.log(err);

        res.status(500).send({
            message: "Unable to create Asset!",
        });

    } finally {
        // Disconnect from the gateway when the application is closing
        // This will close all connections to the network
        gateway.disconnect();
    }
};


module.exports = {
    enrolllUser,
    getAllAssets,
    getAsset,
    createAsset,
    transferAsset,
    shareAsset
};

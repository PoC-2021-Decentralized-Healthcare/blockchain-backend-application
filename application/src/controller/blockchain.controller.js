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

const Base64 = require('crypto-js/enc-base64');
const HmacSHA256 = require('crypto-js/hmac-sha256');
const Utf8 = require('crypto-js/enc-utf8');

const _secret = 'YOUR_VERY_CONFIDENTIAL_SECRET_FOR_SIGNING_JWT_TOKENS!!!';

function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
}


const enrolllUser = async (req, res) => {
    try {

        // build an in memory object with the network configuration (also known as a connection profile)
        const ccp = buildCCPOrg1();

        console.log(req.body)
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

        let responce = {
            "user": {
                "id": "cfaad35d-07a3-4447-a6c3-d8c3d54fd5df",
                "name": req.body.email,
                "email": req.body.email,
                "avatar": "assets/images/avatars/brian-hughes.jpg",
                "status": "online"
            },
            "accessToken": _generateJWTToken(),
            "tokenType": "bearer"
        }

        if(req.body.email == 'patient@blockchain.com') {
            console.log('patient@blockchain.com')
            responce["user"]["id"] =  "cfaad35d-07a3-4447-a6c3-d8c3d54fd5df"
            responce["user"]["avatar"] =  "assets/images/avatars/brian-hughes.jpg",
            responce["accessToken"] =  _generateJWTToken()
        }
        if(req.body.email == 'hospital@blockchain.com') {
            console.log('hospital@blockchain.com')
            responce["user"]["id"] =  "dfaad35d-07a3-4447-a6c3-d8c3d54fd5dg"
            responce["user"]["avatar"] =  "assets/images/avatars/male-07.jpg",
            responce["accessToken"] =  _generateJWTToken()
        }
        if(req.body.email == 'medicallab@blockchain.com') {
            console.log('medicallab@blockchain.com')
            responce["user"]["id"] =  "efaad35d-07a3-4447-a6c3-d8c3d54fd5dh"
            responce["user"]["avatar"] =  "assets/images/avatars/female-11.jpg",
            responce["accessToken"] =  _generateJWTToken()
        }
        
        res.status(200).send(responce);

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



        let resultStr = result.toString()

        let resultObj = JSON.parse(resultStr)

        let newResultStr = resultStr

        for(var i = 0; i < resultObj.length; i++) {
            var obj = resultObj[i];

            console.log(obj);


            let assetStr = Buffer.from(obj.record, 'base64').toString('ascii')

            newResultStr = newResultStr.replace('"' + obj.record + '"', assetStr)
            
        }

        

        console.log(JSON.parse(newResultStr));

        res.status(200).send(JSON.parse(newResultStr));


        //res.status(200).send(prettyJSONString(result.toString()));

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
        
        let resultStr = result.toString()

        let resultObj = JSON.parse(resultStr)

        let assetStr = Buffer.from(resultObj.record, 'base64').toString('ascii')

        let newResultStr = resultStr.replace('"' + resultObj.record + '"', assetStr)

        console.log(JSON.parse(newResultStr));

        res.status(200).send(JSON.parse(newResultStr));

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
        let shared = req.body.shared
        


        console.log('\n--> Get Asset: ', id);
        let result = await contract.evaluateTransaction('ReadAsset', id);
        console.log(`*** Result: ${prettyJSONString(result.toString())}`);

        let resultObj = JSON.parse(result.toString())


        console.log('\n--> Submit Transaction: UpdateAsset {id}, change the appraisedValue to 350');
        await contract.submitTransaction('UpdateAssetV2', id, resultObj.owner, shared, resultObj.base64_record, resultObj.ofchain_id);

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

        let id = uuid.v4()

        console.log(id, req.body.record)
        
        var base64_record = Buffer.from(JSON.stringify(req.body.record)).toString("base64");
        
        //var owner = 'Tomoko';
        //var assetObj = JSON.parse(Buffer.from(strAsset, 'base64').toString('ascii'))

        let result = await contract.submitTransaction('CreateAssetV2', id, req.body.owner, '', base64_record, req.body.ofchain_id);

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


    /**
     * Return base64 encoded version of the given string
     *
     * @param source
     * @private
     */
     function _base64url(source)
     {
         // Encode in classical base64
         let encodedSource = Base64.stringify(source);
 
         // Remove padding equal characters
         encodedSource = encodedSource.replace(/=+$/, '');
 
         // Replace characters according to base64url specifications
         encodedSource = encodedSource.replace(/\+/g, '-');
         encodedSource = encodedSource.replace(/\//g, '_');
 
         // Return the base64 encoded string
         return encodedSource;
     }


    /**
     * Generates a JWT token using CryptoJS library.
     *
     * This generator is for mocking purposes only and it is NOT
     * safe to use it in production frontend applications!
     *
     * @private
     */
     function _generateJWTToken()
     {
         // Define token header
         const header = {
             alg: 'HS256',
             typ: 'JWT'
         };
 
         // Calculate the issued at and expiration dates
         const date = new Date();
         const iat = Math.floor(date.getTime() / 1000);
         const exp = Math.floor((date.setDate(date.getDate() + 7)) / 1000);
 
         // Define token payload
         const payload = {
             iat: iat,
             iss: 'Fuse',
             exp: exp
         };
 
         // Stringify and encode the header
         const stringifiedHeader = Utf8.parse(JSON.stringify(header));
         const encodedHeader = _base64url(stringifiedHeader);
 
         // Stringify and encode the payload
         const stringifiedPayload = Utf8.parse(JSON.stringify(payload));
         const encodedPayload = _base64url(stringifiedPayload);
 
         // Sign the encoded header and mock-api
         let signature = encodedHeader + '.' + encodedPayload;
         signature = HmacSHA256(signature, _secret);
         signature = _base64url(signature);
 
         // Build and return the token
         return encodedHeader + '.' + encodedPayload + '.' + signature;
     }
 
     /**
      * Verify the given token
      *
      * @param token
      * @private
      */
     function _verifyJWTToken(token)
     {
         // Split the token into parts
         const parts = token.split('.');
         const header = parts[0];
         const payload = parts[1];
         const signature = parts[2];
 
         // Re-sign and encode the header and payload using the secret
         const signatureCheck = _base64url(HmacSHA256(header + '.' + payload, _secret));
 
         // Verify that the resulting signature is valid
         return (signature === signatureCheck);
     }

module.exports = {
    enrolllUser,
    getAllAssets,
    getAsset,
    createAsset,
    transferAsset,
    shareAsset
};

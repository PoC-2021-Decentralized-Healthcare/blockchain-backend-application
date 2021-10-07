const express = require("express");
const router = express.Router();
const controller = require("../controller/blockchain.controller");

let routes = (app) => {

  //router.post("/getHealthRecords", controller.getHealthRecords);
  router.post("/enrolllUser", controller.enrolllUser);

  router.get("/getAllAssets/:userId", controller.getAllAssets);
  router.get("/getAsset/:assetId", controller.getAsset);


  router.get("/createAsset", controller.createAsset);
  router.post("/transferAsset", controller.transferAsset);
  
  

  app.use(router);
};

module.exports = routes;

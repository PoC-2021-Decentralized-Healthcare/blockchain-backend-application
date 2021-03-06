const cors = require("cors");
const express = require("express");
const app = express();
var bodyParser = require("body-parser");



let corsOptions = {
//  origin: "http://localhost:8080",
//  origin: "http://localhost:4200",
};

app.use(cors(), bodyParser.json());

const initRoutes = require("./src/routes");

app.use(express.urlencoded({ extended: true }));
initRoutes(app);

const port = 8080;

app.listen(port, () => {
  console.log(`Running at localhost:${port}`);
});



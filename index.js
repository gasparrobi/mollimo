const express = require("express");
const app = express();
const limo = require("./model/limo");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require("axios");
const mollimoApi = "http://www.mollimo.hu/data/cars.js";

const mongoOptions = {
  server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
  replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }
};

const mongodbUri = "mongodb://localhost:27017";

mongoose.Promise = require("bluebird");
mongoose.connect(
  mongodbUri,
  mongoOptions
);
const conn = mongoose.connection;
conn.on("error", console.error.bind(console, "connection error:"));

app.use(function(req, res, next) {
  let allowedOrigins = ["*"]; // list of url-s
  let origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Expose-Headers", "Content-Disposition");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/"));
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.get("/", (req, res) => {
  res.send("hello mongodb");
});

app.get("/addLimo", (req, res) => {
  let lim1 = new limo({ limo_id: "1" });
  lim1.save();
  res.send("add limo");
});

app.get("/getLimos", (req, res) => {
  limo.find((err, limos) => {
    res.type("application/json");
    res.status(200).json(limos);
  });
});

app.get("/mol", async (req, res) => {
  const cars = await axios.get(mollimoApi);
  res.json(JSON.parse(cars.data.split("window.cars = ")[1]));
});

app.get("/testLimo", async (req, res) => {
  const carsReq = await axios.get(mollimoApi);
  const cars = JSON.parse(carsReq.data.split("window.cars = ")[1]);
  const car = cars[0];

  const lim1 = new limo({
    limo_id: car.description.id,
    energyLevel: car.status.energyLevel,
    model: car.description.model,
    cityId: car.description.cityId,
    plate: car.description.name,
    locations: [
      {
        lat: car.location.position.lat.toString(),
        lon: car.location.position.lon.toString()
      }
    ],
    recentLocation: {
      lat: car.location.position.lat.toString(),
      lon: car.location.position.lon.toString()
    }
  });
  lim1.save();
  res.json(lim1);
});

conn.once("open", () => {
  app.listen(8080);
});

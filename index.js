const express = require("express");
const app = express();
const limo = require("./model/limo");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require("axios");
const schedule = require("node-schedule");
const mollimoApi = "http://www.mollimo.hu/data/cars.js";
const keys = require("./config/properties");
const LimoService = require("./service/limoService");
const limoService = new LimoService();

const mongoOptions = {
  server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } },
  replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }
};

const mongodbUri = keys.mongo.mongodbUri;

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

app.get("/getLimos", async (req, res) => {
  let limos = await limoService.getLimos();
  res.json(limos);
});

app.get("/liveData", async (req, res) => {
  const cars = await limoService.getLiveData();
  res.json(cars);
});

app.get("/savelimos", async (req, res) => {
  const carsReq = await axios.get(mollimoApi);
  const cars = JSON.parse(carsReq.data.split("window.cars = ")[1]);
  const limos = [];

  cars.forEach(car => {
    const lim = new limo({
      limo_id: car.description.id,
      energyLevel: car.status.energyLevel,
      model: car.description.model,
      cityId: car.description.cityId,
      plate: car.description.name,
      locations: [
        {
          lat: car.location.position.lat,
          lon: car.location.position.lon
        }
      ],
      recentLocation: {
        lat: car.location.position.lat,
        lon: car.location.position.lon
      }
    });
    limos.push(lim);
    lim.save();
  });

  res.json(limos);
});

app.get("/getLimoById", async (req, res) => {
  console.log(req.query.limoId);
  const limo = await limoService.getLimoById(req.query.limoId);
  res.json(limo);
});

app.get("/getLimoByPlate", async (req, res) => {
  console.log(req.query.plate);
  const limo = await limoService.getLimoByPlate(req.query.plate);
  res.json(limo);
});

app.get("/updateLimos", async (req, res) => {
  limoService.updateLimos();
  res.json({ success: true });
});

let checkSameCoords = (a, b) => {
  return Math.abs(a - b) < 0.0003;
};

conn.once("open", () => {
  app.listen(8080, () => {
    schedule.scheduleJob(" */1 * * * *", async () => {
      console.time("dbsave");
      limoService.updateLimos();
      console.timeEnd("dbsave");
    });
  });
});

const axios = require("axios");
const limo = require("../model/limo");

module.exports = class LimoService {
  constructor() {
    this.mollimoApi = "http://www.mollimo.hu/data/cars.js";
  }

  async updateLimos() {
    const carsReq = await axios.get(this.mollimoApi);
    const cars = JSON.parse(carsReq.data.split("window.cars = ")[1]);

    cars.forEach(async car => {
      this.updateLimo(car);
    });
  }

  async getLimos() {
    let limos = await limo.find().exec();
    return limos;
  }

  async getLiveData() {
    const cars = await axios.get(this.mollimoApi);
    return JSON.parse(cars.data.split("window.cars = ")[1]);
  }

  async getLimoById(limoId) {
    const lim = await limo.findOne({ limo_id: limoId }).exec();
    return lim;
  }

  async getLimoByPlate(plate) {
    const lim = await limo.findOne({ plate: plate }).exec();
    return lim;
  }

  async updateLimo(car) {
    let existing = await limo.findOne({ limo_id: car.description.id }).exec();
    if (existing !== null) {
      if (
        !this.checkSameCoords(existing.recentLocation.lat, car.location.position.lat) ||
        !this.checkSameCoords(existing.recentLocation.lon, car.location.position.lon)
      ) {
        existing.recentLocation.lat = car.location.position.lat;
        existing.recentLocation.lon = car.location.position.lon;
        existing.locations.push({
          lat: car.location.position.lat,
          lon: car.location.position.lon,
          energyLevel: car.status.energyLevel
        });
        existing.save();
      }
    } else {
      const lim = new limo({
        limo_id: car.description.id,
        energyLevel: car.status.energyLevel,
        model: car.description.model,
        cityId: car.description.cityId,
        plate: car.description.name,
        locations: [
          {
            lat: car.location.position.lat,
            lon: car.location.position.lon,
            energyLevel: car.status.energyLevel
          }
        ],
        recentLocation: {
          lat: car.location.position.lat,
          lon: car.location.position.lon
        }
      });
      lim.save();
    }
  }

  checkSameCoords(a, b) {
    return Math.abs(a - b) < 0.0003;
  }
};

let mongoose = require("mongoose");
let Schema = mongoose.Schema;

// Basic User Schema for Google Authentication
const limoSchema = new Schema({
  limo_id: {
    type: String,
    required: [true, "limo_id required"],
    unique: [true, "limo_id already exists"]
  },
  energyLevel: {
    type: Number
  },
  model: {
    type: String,
    default: "up"
  },
  cityId: {
    type: String
  },
  plate: {
    type: String
  },
  locations: [{
    date:{type: Date, default: Date.now},
    lat: {type: String},
    lon: {type: String}
  }]
});

module.exports = mongoose.model("limo", limoSchema);

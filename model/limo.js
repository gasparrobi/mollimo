let mongoose = require("mongoose");
let Schema = mongoose.Schema;

// Basic User Schema for Google Authentication
const limoSchema = new Schema({
  limo_id: {
    type: String,
    required: [true, "limo_id required"],
    unique: [true, "limo_id already exists"]
  },
  type: {
    type: String,
    default: "up"
  }
});

module.exports = mongoose.model("limo", limoSchema);

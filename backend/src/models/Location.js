import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radius: { type: Number, required: true, default: 100 }, // Radius in meters
});

export default mongoose.model("Location", LocationSchema);

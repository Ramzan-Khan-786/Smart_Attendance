import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shapeType: {
    type: String,
    required: true,
    enum: ["Circle", "Polygon"],
  },
  // For Circles
  center: {
    lat: { type: Number },
    lng: { type: Number },
  },
  radius: { type: Number }, // in meters
  // For Polygons
  path: [
    {
      lat: { type: Number },
      lng: { type: Number },
    },
  ],
});

export default mongoose.model("Location", LocationSchema);

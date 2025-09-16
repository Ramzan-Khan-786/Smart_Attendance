import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  isActive: { type: Boolean, default: true },
  excelPath: { type: String },
});

export default mongoose.model("Session", SessionSchema);

import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
});

AttendanceSchema.index({ user: 1, session: 1 }, { unique: true });

export default mongoose.model("Attendance", AttendanceSchema);

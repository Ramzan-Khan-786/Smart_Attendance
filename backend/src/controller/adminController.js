import Location from "../models/Location.js";
import Session from "../models/Session.js";
import Attendance from "../models/Attendance.js";
import generateExcel from "../utils/generateExcel.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const addLocation = async (req, res) => {
  const { name, latitude, longitude, radius } = req.body;
  try {
    const newLocation = new Location({ name, latitude, longitude, radius });
    const location = await newLocation.save();
    res.status(201).json(location);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

export const getLocations = async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

export const startSession = async (req, res) => {
  const { name, locationId } = req.body;
  try {
    const location = await Location.findById(locationId);
    if (!location) return res.status(404).json({ msg: "Location not found" });

    await Session.updateMany(
      { isActive: true },
      { $set: { isActive: false, endTime: new Date() } }
    );

    const newSession = new Session({ name, location: locationId });
    await newSession.save();

    const sessionData = {
      ...newSession.toObject(),
      location: location.toObject(),
    };

    global.io.emit("session-started", sessionData);
    res.status(201).json(sessionData);
  } catch (err) {
    console.error("Start Session Error:", err);
    res.status(500).send("Server Error");
  }
};

export const endSession = async (req, res) => {
  try {
    const session = await Session.findOne({ isActive: true });
    if (!session)
      return res.status(404).json({ msg: "No active session found" });

    session.isActive = false;
    session.endTime = new Date();

    const attendanceRecords = await Attendance.find({
      session: session._id,
    }).populate("user", "name email");

    if (attendanceRecords.length > 0) {
      const reportPath = await generateExcel(attendanceRecords, session.name);
      session.excelPath = reportPath;
    }

    await session.save();

    global.io.emit("session-ended", { sessionId: session._id.toString() });

    res.json({ msg: "Session ended successfully", session });
  } catch (err) {
    console.error("End Session Error:", err);
    res.status(500).send("Server Error");
  }
};

export const getPresentUsers = async (req, res) => {
  try {
    const activeSession = await Session.findOne({ isActive: true });
    if (!activeSession) return res.json([]);

    const attendance = await Attendance.find({
      session: activeSession._id,
    }).populate("user", "name email");
    res.json(attendance);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

export const getPreviousSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ isActive: false })
      .populate("location")
      .sort({ startTime: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

// ADD THIS FUNCTION BACK - WITH THE CORRECTED PATH
export const downloadReport = (req, res) => {
  try {
    const { filename } = req.params;

    // THE FIX: Construct the absolute path to the project's root `reports` folder
    // We go up two directories from `src/controller` to the project root
    const filePath = path.resolve(__dirname, "..", "..", "reports", filename);

    console.log("Attempting to download file from secure route:", filePath);

    // res.download() handles headers and file streaming
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        // Don't send a generic "File not found" if headers are already sent
        if (!res.headersSent) {
          res
            .status(404)
            .send({ message: "File not found or cannot be read." });
        }
      }
    });
  } catch (err) {
    console.error("Server error on download:", err);
    if (!res.headersSent) {
      res.status(500).send("Server error during file download");
    }
  }
};

import Location from "../models/Location.js";
import Session from "../models/Session.js";
import Attendance from "../models/Attendance.js";
import generateExcelBuffer from "../utils/generateExcel.js";
import User from "../models/User.js";
export const addLocation = async (req, res) => {
  try {
    const newLocation = new Location({
      ...req.body,
      adminID: req.user.id,
    });
    const location = await newLocation.save();
    res.status(201).json(location);
  } catch (err) {
    console.error("Add Location Error:", err);
    res.status(500).send("Server Error");
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const locationId = req.params.id;
    const activeSession = await Session.findOne({
      location: locationId,
      isActive: true,
      adminID: adminID,
    });

    if (activeSession) {
      return res.status(400).json({
        msg: "Cannot delete a location that is part of an active session.",
      });
    }

    const location = await Location.findByOneAndDelete({
      _id: locationId,
      adminId: adminId,
    });
    if (!location) {
      return res
        .status(404)
        .json({ msg: "Location not found or you do not own it" });
    }
    res.json({ msg: "Location removed" });
  } catch (err) {
    console.error("Delete Location Error:", err);
    res.status(500).send("Server Error");
  }
};

export const getLocations = async (req, res) => {
  try {
    const locations = await Location.find({ adminId: req.user.id });
    res.json(locations);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

export const startSession = async (req, res) => {
  const { name, locationId } = req.body;
  try {
    const location = await Location.findOne({
      _id: locationId,
      adminId: adminId,
    });
    if (!location) return res.status(404).json({ msg: "Location not found" });

    await Session.updateMany(
      { isActive: true, adminId: adminId },
      { $set: { isActive: false, endTime: new Date() } }
    );

    const newSession = new Session({
      name,
      location: locationId,
      adminId: adminId,
    });
    await newSession.save();

    const populatedSession = await Session.findById(newSession._id).populate(
      "location"
    );

    global.io.emit("session-started", populatedSession);
    res.status(201).json(populatedSession);
  } catch (err) {
    console.error("Start Session Error:", err);
    res.status(500).send("Server Error");
  }
};

export const endSession = async (req, res) => {
  try {
    const session = await Session.findOne({
      isActive: true,
      adminId: req.user.id,
    });
    if (!session)
      return res.status(404).json({ msg: "No active session found" });

    // Simply end the session. No need to generate Excel here.
    session.isActive = false;
    session.endTime = new Date();
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
    const activeSession = await Session.findOne({
      isActive: true,
      adminId: req.user.id,
    });
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
    const sessions = await Session.find({
      isActive: false,
      adminId: req.user.id,
    })
      .populate("location")
      .sort({ startTime: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

export const downloadReport = async (req, res) => {
  try {
    // Correctly use sessionId from the route parameter
    const { sessionId } = req.params;

    const session = await Session.findById({
      _id: sessionId,
      adminId: req.user.id,
    });
    if (!session) {
      return res
        .status(404)
        .json({ message: "Session not found or you do not own it" });
    }

    const data = await Attendance.find({ session: sessionId }).populate(
      "user",
      "name email"
    );

    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ message: "No attendance records found for this session." });
    }

    const buffer = await generateExcelBuffer(data, session.name);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Attendance-${session.name.replace(
        /\s+/g,
        "_"
      )}-${sessionId}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
};
// NEW FUNCTION: Fetch all user data needed for face matching
export const getAllUsersForMatching = async (req, res) => {
  try {
    // Select only the fields needed to minimize data transfer
    const users = await User.find().select("name faceDescriptor");
    res.json(users);
  } catch (err) {
    console.error("Get All Users Error:", err);
    res.status(500).send("Server Error");
  }
};

// NEW FUNCTION: Allow admin to mark attendance for a specific user
export const markAttendanceByAdmin = async (req, res) => {
  const { userId, sessionId } = req.body;
  const adminId = req.user.id;
  try {
    const session = await Session.findOne({ _id: sessionId, adminId: adminId });
    if (!session) {
      return res
        .status(403)
        .json({ msg: "Access denied. You do not own this session." });
    }
    // Check if attendance is already marked for this user in this session
    const existingAttendance = await Attendance.findOne({
      user: userId,
      session: sessionId,
    });
    if (existingAttendance) {
      return res.status(200).json({ msg: "Attendance already marked." });
    }

    // Create new attendance record
    const newAttendance = new Attendance({
      user: userId,
      session: sessionId,
      isVerified: true, // Marked by admin, so it's considered verified
      adminId: adminId,
    });
    await newAttendance.save();

    const populatedAttendance = await Attendance.findById(
      newAttendance._id
    ).populate("user", "name email");

    // Notify all clients that a new user has been marked present
    global.io.emit("user-verified", populatedAttendance);

    res.status(201).json(populatedAttendance);
  } catch (err) {
    console.error("Mark Attendance by Admin Error:", err);
    res.status(500).send("Server Error");
  }
};

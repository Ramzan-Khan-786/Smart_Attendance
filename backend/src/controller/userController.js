import Session from "../models/Session.js";
import Attendance from "../models/Attendance.js";

export const markAttendance = async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.id;

  try {
    const session = await Session.findById(sessionId);
    if (!session || !session.isActive) {
      return res.status(400).json({ msg: "Session is not active." });
    }

    let attendance = await Attendance.findOne({
      user: userId,
      session: sessionId,
    });
    if (attendance) {
      return res.status(400).json({ msg: "Attendance already marked." });
    }

    attendance = new Attendance({
      user: userId,
      session: sessionId,
      isVerified: true,
    });
    await attendance.save();

    const populatedAttendance = await Attendance.findById(
      attendance._id
    ).populate("user", "name email");

    global.io.emit("user-verified", populatedAttendance);
    res.status(201).json(populatedAttendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

export const getActiveSession = async (req, res) => {
  try {
    const activeSession = await Session.findOne({ isActive: true }).populate(
      "location"
    );
    if (!activeSession) {
      return res.json({ activeSession: null, userAttendance: null });
    }

    const userAttendance = await Attendance.findOne({
      user: req.user.id,
      session: activeSession._id,
    });

    res.json({ activeSession, userAttendance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

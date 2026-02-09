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
      adminId: session.adminId, // <-- FIX: Add adminId for consistency
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
    // 1. Find ALL active sessions, not just one.
    const activeSessions = await Session.find({ isActive: true })
      .populate("location")
      .lean(); // .lean() makes it faster

    // 2. If there are no sessions, return an empty array
    if (!activeSessions || activeSessions.length === 0) {
      return res.json({ activeSessions: [] });
    }

    // 3. For each active session, check if THIS user has attended
    const sessionsWithAttendance = await Promise.all(
      activeSessions.map(async (session) => {
        const userAttendance = await Attendance.findOne({
          user: req.user.id,
          session: session._id,
        }).lean();

        // Return the session details, plus the user's attendance status
        return {
          ...session,
          userAttendance: userAttendance, // Will be null or the attendance doc
        };
      })
    );

    res.json({ activeSessions: sessionsWithAttendance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

import React, { useState, useEffect } from "react";
import api from "@/services/api";
import io from "socket.io-client";
import toast from "react-hot-toast"; // Added missing import

const socket = io("http://localhost:5000");

const AttendanceMonitor = () => {
  const [presentUsers, setPresentUsers] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  const fetchActiveData = async () => {
    try {
      const sessionRes = await api.get("/user/sessions/active");
      if (sessionRes.data.activeSession) {
        setActiveSession(sessionRes.data.activeSession);
        const attendanceRes = await api.get(
          "/admin/sessions/active/attendance"
        );
        setPresentUsers(attendanceRes.data);
      } else {
        setActiveSession(null);
        setPresentUsers([]);
      }
    } catch (error) {
      setActiveSession(null);
      setPresentUsers([]);
    }
  };

  useEffect(() => {
    fetchActiveData();

    socket.on("user-verified", (newRecord) => {
      setPresentUsers((prev) => [newRecord, ...prev]);
    });

    socket.on("session-ended", () => {
      toast.info("The session has ended.");
      setPresentUsers([]);
      setActiveSession(null);
    });
    socket.on("session-started", (session) => {
      toast.success(`Session "${session.name}" has started.`);
      setActiveSession(session);
      setPresentUsers([]);
    });

    return () => {
      socket.off("user-verified");
      socket.off("session-ended");
      socket.off("session-started");
    };
  }, []);

  if (!activeSession) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">
          Live Attendance
        </h2>
        <p className="text-gray-500">No active session is running.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-gray-800">Live Attendance</h2>
      <p className="text-gray-600 mb-4">
        Session: <span className="font-semibold">{activeSession.name}</span> -{" "}
        <span className="font-bold text-green-600">
          {presentUsers.length} Present
        </span>
      </p>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {presentUsers.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">
                  Waiting for users...
                </td>
              </tr>
            )}
            {presentUsers.map((record) => (
              <tr key={record._id}>
                <td className="py-3 px-4 whitespace-nowrap">
                  {record.user.name}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {record.user.email}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {new Date(record.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceMonitor;

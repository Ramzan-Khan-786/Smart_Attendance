import React, { useState, useEffect } from "react";
import api from "@/services/api";
import toast from "react-hot-toast";
import io from "socket.io-client";
import { PlayCircle, StopCircle, Camera } from "lucide-react";
import CameraScanner from "./CameraScanner"; // Import the new component

const socket = io("http://localhost:5000");

const SessionManager = () => {
  const [locations, setLocations] = useState([]);
  const [sessionName, setSessionName] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const fetchInitialData = async () => {
    try {
      const locRes = await api.get("/admin/locations");
      setLocations(locRes.data);
      const sessionRes = await api.get("/user/sessions/active");
      setActiveSession(sessionRes.data.activeSession);
    } catch (err) {
      console.error("Error fetching initial data", err);
    }
  };

  useEffect(() => {
    fetchInitialData();
    socket.on("session-started", (sessionData) =>
      setActiveSession(sessionData)
    );
    socket.on("session-ended", () => {
      setActiveSession(null);
      setIsScannerOpen(false); // Close scanner when session ends
    });
    return () => {
      socket.off("session-started");
      socket.off("session-ended");
    };
  }, []);

  const handleStartSession = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/sessions/start", {
        name: sessionName,
        locationId: selectedLocation,
      });
      toast.success("Session started!");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to start session.");
    }
  };

  const handleEndSession = async () => {
    try {
      await api.put("/admin/sessions/end");
      toast.success("Session ended!");
      setSessionName("");
      setSelectedLocation("");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to end session.");
    }
  };

  if (activeSession) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Active Session Control
        </h2>
        <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 space-y-4">
          <p className="text-xl font-semibold text-gray-700">
            Session "{activeSession.name}" is running.
          </p>

          {isScannerOpen ? (
            <div>
              <h3 className="font-semibold mb-2">Live Attendance Scanner</h3>
              <CameraScanner
                activeSession={activeSession}
                onUserMarked={() => {}}
              />
              <button
                onClick={() => setIsScannerOpen(false)}
                className="mt-4 px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close Scanner
              </button>
            </div>
          ) : (
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="py-3 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Camera /> Open Camera Scanner
              </button>
              <button
                onClick={handleEndSession}
                className="py-3 px-6 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <StopCircle /> End Session
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Start a New Session
      </h2>
      <form
        onSubmit={handleStartSession}
        className="space-y-4 max-w-md mx-auto"
      >
        <div>
          <label className="font-medium text-gray-700">Session Name</label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            required
            className="w-full mt-1 p-2 border rounded"
            placeholder="e.g., Morning Lecture"
          />
        </div>
        <div>
          <label className="font-medium text-gray-700">Location</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            required
            className="w-full mt-1 p-2 border rounded bg-white"
          >
            <option value="">Select a location</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={!sessionName || !selectedLocation}
          className="w-full py-2.5 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2 font-semibold disabled:bg-gray-400"
        >
          <PlayCircle /> Start Session
        </button>
      </form>
    </div>
  );
};

export default SessionManager;

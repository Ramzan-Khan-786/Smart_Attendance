import React, { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import Webcam from "react-webcam";
import { loadModels, getFaceDescriptor, matchFace } from "@/utils/faceApi";
import { isWithinGeofence } from "@/utils/geo";
import Spinner from "@/components/Spinner";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polygon,
} from "react-leaflet";
import { Check, X, Camera, LogIn } from "lucide-react"; // Added LogIn
import io from "socket.io-client";

// --- FIX: Use the VITE_API_URL or a fallback for production ---
const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");

// --- FIX: A new component to render the details of a selected session ---
// I have moved your main UI into this new component.
const SessionDetails = ({ session, user, onAttendanceMarked }) => {
  const [status, setStatus] = useState({
    verifying: false,
    modelsLoaded: false,
    isInside: null,
    isVerified: false,
    message: "Initializing...",
  });
  const [userCoords, setUserCoords] = useState(null);
  const webcamRef = useRef(null);

  // --- FIX: Load models when this component mounts ---
  useEffect(() => {
    loadModels().then(() => setStatus((s) => ({ ...s, modelsLoaded: true })));
  }, []);

  const checkLocation = () => {
    setStatus((s) => ({ ...s, message: "Getting your location..." }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserCoords(coords);
        // --- FIX: Pass the location object from the session ---
        const inside = isWithinGeofence(coords, session.location);
        setStatus((s) => ({
          ...s,
          isInside: inside,
          message: inside ? "Location confirmed." : "You are outside the area.",
        }));
      },
      () => {
        toast.error("Could not get location. Please enable location services.");
        setStatus((s) => ({ ...s, message: "Location permission denied." }));
      }
    );
  };

  const handleVerification = async () => {
    if (!webcamRef.current) return;
    setStatus((s) => ({
      ...s,
      verifying: true,
      message: "Verifying your face...",
    }));

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error("Could not capture image.");
      setStatus((s) => ({ ...s, verifying: false }));
      return;
    }

    const img = document.createElement("img");
    img.src = imageSrc;
    img.onload = async () => {
      const liveDescriptor = await getFaceDescriptor(img);
      if (!liveDescriptor) {
        toast.error("No face detected. Try again.");
        setStatus((s) => ({
          ...s,
          verifying: false,
          message: "Face not detected. Please reposition.",
        }));
        return;
      }

      const distance = matchFace(user.faceDescriptor, liveDescriptor);

      if (distance < 0.5) {
        // 0.5 is a good threshold
        toast.success("Face verified!");
        setStatus((s) => ({
          ...s,
          isVerified: true,
          message: "Marking attendance...",
        }));
        try {
          // --- FIX: Pass the correct session ID ---
          const res = await api.post("/user/attendance/mark", {
            sessionId: session._id,
          });
          // --- FIX: Call the parent function to update state ---
          onAttendanceMarked(res.data);
          toast.success("Attendance marked successfully!");
          setStatus((s) => ({ ...s, message: "Attendance Marked!" }));
        } catch (err) {
          toast.error(err.response?.data?.msg || "Failed to mark attendance.");
          setStatus((s) => ({ ...s, isVerified: false }));
        }
      } else {
        toast.error("Face not recognized. Please try again.");
        setStatus((s) => ({
          ...s,
          message: "Verification Failed. Please try again.",
        }));
      }
      setStatus((s) => ({ ...s, verifying: false }));
    };
  };

  // --- FIX: Get status from this component's state ---
  const { isInside, isVerified, verifying, message } = status;
  const location = session.location;

  // --- FIX: Check the session's userAttendance property ---
  if (session.userAttendance) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow">
        <p className="text-green-600 font-bold text-xl">
          ✅ Your attendance for "{session.name}" has been marked.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-1">
        Active Session: {session.name}
      </h1>
      <p className="text-gray-600 mb-6">Location: {location.name}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h2 className="font-semibold text-lg">Attendance Status</h2>
              <ul className="mt-2 space-y-2">
                <li
                  className={`flex items-center gap-2 ${
                    isInside !== null ? "" : "text-gray-400"
                  }`}
                >
                  {isInside ? (
                    <Check className="text-green-500" />
                  ) : (
                    <X className="text-red-500" />
                  )}{" "}
                  Inside Geofence
                </li>
                <li
                  className={`flex items-center gap-2 ${
                    isVerified ? "" : "text-gray-400"
                  }`}
                >
                  {isVerified ? (
                    <Check className="text-green-500" />
                  ) : (
                    <X className="text-red-500" />
                  )}{" "}
                  Camera Verified
                </li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h2 className="font-semibold text-lg">Step 1: Location Check</h2>
              {!userCoords && (
                <button
                  onClick={checkLocation}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Check My Location
                </button>
              )}
              <p className="mt-2 text-sm text-gray-700 h-6">{message}</p>
            </div>

            <div
              className={`p-4 border rounded-lg transition-opacity ${
                !isInside ? "opacity-50" : ""
              }`}
            >
              <h2 className="font-semibold text-lg">
                Step 2: Self-Verification
              </h2>
              {isInside ? (
                <div className="flex flex-col items-center mt-2">
                  <div className="w-full max-w-xs rounded-lg overflow-hidden mb-4 border">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                    />
                  </div>
                  <button
                    onClick={handleVerification}
                    disabled={verifying || !status.modelsLoaded}
                    className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 w-full max-w-xs flex items-center justify-center gap-2"
                  >
                    {verifying ? (
                      <Spinner />
                    ) : (
                      <>
                        <Camera size={18} /> Verify & Mark Attendance
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">
                  You must be inside the geofence to verify.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="h-80 lg:h-full rounded-lg overflow-hidden border">
          <MapContainer
            center={
              location.shapeType === "Circle"
                ? [location.center.lat, location.center.lng]
                : [location.path[0].lat, location.path[0].lng]
            }
            zoom={15}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {location.shapeType === "Circle" && (
              <Circle
                center={[location.center.lat, location.center.lng]}
                radius={location.radius}
                pathOptions={{ color: "blue", fillColor: "blue" }}
              />
            )}
            {location.shapeType === "Polygon" && (
              <Polygon
                positions={location.path.map((p) => [p.lat, p.lng])}
                pathOptions={{ color: "blue", fillColor: "blue" }}
              />
            )}
            {userCoords && (
              <Marker position={[userCoords.latitude, userCoords.longitude]} />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

// --- THIS IS THE MAIN COMPONENT ---
const StudentDashboard = () => {
  // --- FIX 1: New state to handle a list of sessions ---
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  // --------------------------------------------------

  const { user } = useAuth();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // --- FIX 2: API now returns { activeSessions: [...] } ---
        const res = await api.get("/user/sessions/active");
        setActiveSessions(res.data.activeSessions);

        // --- FIX 3: Smart auto-select if only one session ---
        if (res.data.activeSessions.length === 1) {
          setSelectedSession(res.data.activeSessions[0]);
        }
        // ----------------------------------------------------
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // --- FIX 4: Real-time updates for sessions ---
    socket.on("session-started", (newSession) => {
      toast.info(`New session started: ${newSession.name}`);
      // Add the new session to the list
      setActiveSessions((prev) => [...prev, newSession]);
    });

    socket.on("session-ended", ({ sessionId }) => {
      toast.info("A session has ended.");
      // Remove from the main list
      setActiveSessions((prev) => prev.filter((s) => s._id !== sessionId));
      // If it was the selected session, go back to the list
      setSelectedSession((prev) =>
        prev && prev._id === sessionId ? null : prev
      );
    });

    return () => {
      socket.off("session-started");
      socket.off("session-ended");
    };
    // ---------------------------------------------
  }, []);

  // --- FIX 5: Function to update state when attendance is marked ---
  const handleAttendanceMarked = (attendanceRecord) => {
    // Find the session in our list and update its userAttendance
    const updatedSession = {
      ...selectedSession,
      userAttendance: attendanceRecord,
    };

    // Update the main list
    setActiveSessions((prev) =>
      prev.map((s) => (s._id === updatedSession._id ? updatedSession : s))
    );
    // Update the selected session (to show the success message)
    setSelectedSession(updatedSession);
  };
  // -----------------------------------------------------------

  // --- FIX 6: New render logic ---
  if (loading) {
    return (
      <div className="flex justify-center mt-10">
        <Spinner size="large" />
      </div>
    );
  }

  // No sessions are active
  if (activeSessions.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow">
        <p>No active attendance session at the moment.</p>
      </div>
    );
  }

  // A session is selected, show the details
  if (selectedSession) {
    return (
      <SessionDetails
        session={selectedSession}
        user={user}
        onAttendanceMarked={handleAttendanceMarked}
      />
    );
  }

  // --- FIX 7: NEW UI: The Session Selection List ---
  // More than one session, and none selected yet
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Active Sessions</h1>
      <p className="text-gray-600 mb-6">
        Multiple sessions are active. Please choose one to join.
      </p>
      <div className="space-y-4">
        {activeSessions.map((session) => (
          <div
            key={session._id}
            className="p-4 border rounded-lg flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold text-lg">{session.name}</h2>
              <p className="text-sm text-gray-500">{session.location.name}</p>
            </div>
            {session.userAttendance ? (
              <span className="text-green-600 font-semibold flex items-center gap-2">
                <Check size={18} /> Marked
              </span>
            ) : (
              <button
                onClick={() => setSelectedSession(session)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
              >
                <LogIn size={16} /> Join
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
  // ------------------------------------------------
};

export default StudentDashboard;

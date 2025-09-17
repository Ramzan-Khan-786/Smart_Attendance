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
import { Check, X, Camera } from "lucide-react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const StudentDashboard = () => {
  const [sessionData, setSessionData] = useState({
    activeSession: null,
    userAttendance: null,
  });
  const [status, setStatus] = useState({
    loading: true,
    verifying: false,
    modelsLoaded: false,
    isInside: null,
    isVerified: false,
    message: "Initializing...",
  });
  const [userCoords, setUserCoords] = useState(null);

  const { user } = useAuth();
  const webcamRef = useRef(null);

  useEffect(() => {
    loadModels().then(() => setStatus((s) => ({ ...s, modelsLoaded: true })));

    const fetchSession = async () => {
      try {
        const res = await api.get("/user/sessions/active");
        setSessionData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setStatus((s) => ({ ...s, loading: false }));
      }
    };

    fetchSession();

    socket.on("session-ended", () => {
      toast.info("The current session has ended.");
      setSessionData({ activeSession: null, userAttendance: null });
    });

    return () => socket.off("session-ended");
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
        const inside = isWithinGeofence(
          coords,
          sessionData.activeSession.location
        ); // Pass the whole location object
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
        toast.success("Face verified!");
        setStatus((s) => ({
          ...s,
          isVerified: true,
          message: "Marking attendance...",
        }));
        try {
          await api.post("/user/attendance/mark", {
            sessionId: sessionData.activeSession._id,
          });
          setSessionData((prev) => ({
            ...prev,
            userAttendance: { marked: true },
          }));
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

  const { activeSession, userAttendance } = sessionData;
  const { loading, isInside, isVerified, verifying, message } = status;

  if (loading)
    return (
      <div className="flex justify-center mt-10">
        <Spinner size="large" />
      </div>
    );
  if (!activeSession)
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow">
        <p>No active attendance session at the moment.</p>
      </div>
    );
  if (userAttendance)
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow">
        <p className="text-green-600 font-bold text-xl">
          ✅ Your attendance for "{activeSession.name}" has been marked.
        </p>
      </div>
    );

  const location = activeSession.location;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-1">
        Active Session: {activeSession.name}
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
                <li
                  className={`flex items-center gap-2 ${
                    userAttendance ? "" : "text-gray-400"
                  }`}
                >
                  {userAttendance ? (
                    <Check className="text-green-500" />
                  ) : (
                    <X className="text-red-500" />
                  )}{" "}
                  Attendance Marked
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

export default StudentDashboard;

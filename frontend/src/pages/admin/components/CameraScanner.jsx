import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import api from "@/services/api";
import toast from "react-hot-toast";
import { isWithinGeofence } from "@/utils/geo";
import Spinner from "@/components/Spinner";

// Direct URL to the hosted face-api.js models
// const MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights";
const MODEL_URL = "https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js/weights";

const CameraScanner = ({ activeSession, onUserMarked }) => {
  const [loadingMessage, setLoadingMessage] = useState(
    "Initializing Scanner..."
  );
  const [allUsers, setAllUsers] = useState([]); // Will now store { _id, name, descriptor }
  const [isReady, setIsReady] = useState(false);
  const [markedUserIds, setMarkedUserIds] = useState(new Set());
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const setupScanner = useCallback(async () => {
    setLoadingMessage("Checking your location against the geofence...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const adminCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        if (!isWithinGeofence(adminCoords, activeSession.location)) {
          toast.error("You must be inside the geofence to use the scanner.");
          setLoadingMessage("Error: You are outside the geofence area.");
          return;
        }

        setLoadingMessage("Loading face recognition models...");
        // Load models from the direct URL
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setLoadingMessage("Fetching all user face data...");
        const res = await api.get("/admin/users/match-data");
        // Store user ID and name along with the descriptor for efficient lookup
        const usersWithDescriptors = res.data.map((user) => ({
          _id: user._id,
          name: user.name,
          descriptor: new faceapi.LabeledFaceDescriptors(user.name, [
            new Float32Array(user.faceDescriptor),
          ]),
        }));
        setAllUsers(usersWithDescriptors);

        setLoadingMessage("");
        setIsReady(true);
      },
      () => {
        toast.error("Could not get your location. Please enable permissions.");
        setLoadingMessage("Error: Location permission denied.");
      }
    );
  }, [activeSession]);

  useEffect(() => {
    setupScanner();
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [setupScanner]);

  const handleScan = useCallback(async () => {
    if (!webcamRef.current || !canvasRef.current || !allUsers.length) return;

    const video = webcamRef.current.video;
    if (video.readyState !== 4) return;

    if (!canvasRef.current) return;
    canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(video);
    faceapi.matchDimensions(canvasRef.current, {
      width: video.videoWidth,
      height: video.videoHeight,
    });

    const faceMatcher = new faceapi.FaceMatcher(
      allUsers.map((u) => u.descriptor),
      0.5
    );

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, {
      width: video.videoWidth,
      height: video.videoHeight,
    });

    for (const detection of resizedDetections) {
      const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
      if (bestMatch.label !== "unknown") {
        // Find the user from the state, no need for a new API call
        const originalUser = allUsers.find((u) => u.name === bestMatch.label);

        if (originalUser && !markedUserIds.has(originalUser._id)) {
          setMarkedUserIds((prev) => new Set(prev).add(originalUser._id));
          try {
            const res = await api.post("/admin/attendance/mark", {
              userId: originalUser._id,
              sessionId: activeSession._id,
            });
            if (res.status === 201) {
              toast.success(`Marked ${originalUser.name} as present!`);
              onUserMarked();
            }
          } catch (err) {
            console.error(err);
            // If API fails, allow the user to be scanned again
            setMarkedUserIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(originalUser._id);
              return newSet;
            });
          }
        }

        const box = detection.detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: bestMatch.toString(),
        });
        drawBox.draw(canvasRef.current);
      }
    }
  }, [allUsers, activeSession._id, markedUserIds, onUserMarked]);

  useEffect(() => {
    if (isReady) {
      intervalRef.current = setInterval(handleScan, 2000);
    }
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [isReady, handleScan]);

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Spinner />
        <p className="mt-4 text-gray-600">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative flex justify-center w-full max-w-lg mx-auto">
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored={true}
        className="rounded-lg w-full h-auto"
      />
      <canvas ref={canvasRef} className="absolute top-0 left-0" />
    </div>
  );
};

export default CameraScanner;

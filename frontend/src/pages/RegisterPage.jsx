import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { loadModels, getFaceDescriptor } from "../utils/faceApi";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";
import { Camera, CheckCircle, AlertCircle } from "lucide-react";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const webcamRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const initFaceApi = async () => {
      await loadModels();
      setModelsLoaded(true);
    };
    initFaceApi();
  }, []);

  const { name, email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const captureFace = useCallback(async () => {
    if (!webcamRef.current) return;
    setIsCapturing(true);
    setFaceDescriptor(null);
    toast.loading("Detecting face...");

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.dismiss();
      toast.error("Could not capture image from webcam.");
      setIsCapturing(false);
      return;
    }
    const img = document.createElement("img");
    img.src = imageSrc;
    img.onload = async () => {
      const descriptor = await getFaceDescriptor(img);
      toast.dismiss();
      if (descriptor) {
        setFaceDescriptor(descriptor);
        toast.success("Face captured successfully!");
      } else {
        toast.error("No face detected. Please try again.");
      }
      setIsCapturing(false);
    };
  }, [webcamRef]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!faceDescriptor) {
      toast.error("Please capture your face before registering.");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, faceDescriptor);
      toast.success("Registration successful! Welcome.");
      navigate("/student/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center mt-8">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Create Your Account
        </h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            value={name}
            onChange={onChange}
            required
            placeholder="Full Name"
            className="w-full px-4 py-2 mt-1 border rounded-md"
          />
          <input
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            required
            placeholder="Email Address"
            className="w-full px-4 py-2 mt-1 border rounded-md"
          />
          <input
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            required
            placeholder="Password"
            className="w-full px-4 py-2 mt-1 border rounded-md"
          />

          <div className="text-center p-4 border-2 border-dashed rounded-lg">
            <h2 className="font-semibold mb-2 text-gray-700">
              Face Registration
            </h2>
            {!modelsLoaded && (
              <p className="text-sm text-gray-500">
                Loading face recognition models...
              </p>
            )}
            {modelsLoaded && (
              <div className="flex flex-col items-center">
                <div className="w-full max-w-xs rounded-lg overflow-hidden mb-4 border">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                  />
                </div>
                <button
                  type="button"
                  onClick={captureFace}
                  disabled={isCapturing}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center gap-2 disabled:opacity-60"
                >
                  <Camera size={18} />
                  {isCapturing
                    ? "Processing..."
                    : faceDescriptor
                    ? "Recapture Face"
                    : "Capture Face"}
                </button>
                {faceDescriptor ? (
                  <p className="text-green-600 mt-2 flex items-center gap-1 text-sm">
                    <CheckCircle size={16} /> Face data is ready.
                  </p>
                ) : (
                  <p className="text-red-500 mt-2 flex items-center gap-1 text-sm">
                    <AlertCircle size={16} /> Face data is required.
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !faceDescriptor}
            className="w-full py-2.5 px-4 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex justify-center"
          >
            {loading ? <Spinner /> : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

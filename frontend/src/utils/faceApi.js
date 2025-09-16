import * as faceapi from "face-api.js";

const MODEL_URL = "https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js/weights";

export const loadModels = async () => {
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  } catch (error) {
    console.error("Error loading face-api models:", error);
  }
};

export const getFaceDescriptor = async (image) => {
  if (!image) return null;
  const detection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection ? Array.from(detection.descriptor) : null;
};

export const matchFace = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2) return 99;
  return faceapi.euclideanDistance(descriptor1, descriptor2);
};

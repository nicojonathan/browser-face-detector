// TensorFlow.js and faceDetection are loaded by the HTML script tags.
const tf = window.tf;
const faceDetection = window.faceDetection;

// =========================================
// DOM ELEMENTS
// =========================================

const video = document.getElementById("camera");
const message = document.getElementById("detection-message");
const detectionIcon = document.querySelector(".detection-icon");
const cameraPlaceholder = document.querySelector(".camera-placeholder");
const faceGuide = document.querySelector(".face-guide");
const scanLine = document.querySelector(".scan-line");
const cameraStatus = document.querySelector(".status");

// =========================================
// CONFIGURATION
// =========================================

const REQUIRED_STABLE_TIME = 700;
const MIN_FACE_SIZE = 0.25;

// Must be greater than 1 to detect and reject multiple faces.
const MAX_FACES = 5;

let faceDetector = null;
let stream = null;

let validSince = null;
let captured = false;
let running = false;
let pageClosed = false;
let detecting = false;
let animationFrameId = null;
let lastVideoTime = -1;

// =========================================
// UI
// =========================================

function setStatus(text, type = "waiting") {
  message.textContent = text;

  const colors = {
    waiting: "#fbbf24",
    warning: "#fbbf24",
    error: "#f87171",
    success: "#6ee7b7",
  };

  const color = colors[type] || colors.waiting;

  detectionIcon.style.background = color;
  detectionIcon.style.boxShadow = `0 0 10px ${color}`;

  faceGuide.style.borderColor =
    type === "waiting" ? "rgba(255, 255, 255, 0.18)" : color;

  const scanColor = type === "waiting" ? "#6ee7b7" : color;

  scanLine.style.background = `linear-gradient(90deg, transparent, ${scanColor}, transparent)`;
}

function setCameraStatus(text) {
  if (!cameraStatus) return;

  const dot = document.createElement("span");
  dot.className = "status-dot";

  cameraStatus.replaceChildren(dot, document.createTextNode(` ${text}`));
}

// =========================================
// INITIALIZE TENSORFLOW.JS
// =========================================

async function initializeFaceDetector() {
  setCameraStatus("Initializing");
  setStatus("Loading face detection...");

  try {
    if (!tf || !faceDetection) {
      throw new Error("TensorFlow.js libraries failed to load.");
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Camera access requires HTTPS or localhost and a supported browser.",
      );
    }

    // Prefer GPU acceleration; fall back to CPU.
    try {
      const available = await tf.setBackend("webgl");

      if (!available) {
        throw new Error("WebGL is unavailable.");
      }

      await tf.ready();
    } catch {
      await tf.setBackend("cpu");
      await tf.ready();
    }

    if (pageClosed) return;

    faceDetector = await faceDetection.createDetector(
      faceDetection.SupportedModels.MediaPipeFaceDetector,
      {
        runtime: "tfjs",
        modelType: "short",
        maxFaces: MAX_FACES,
      },
    );

    if (pageClosed) {
      disposeDetector();
      return;
    }

    await startCamera();
  } catch (error) {
    console.error("Initialization failed:", error);

    stopCamera();
    disposeDetector();

    if (!pageClosed) {
      setCameraStatus("Unavailable");
      setStatus(error.message || "Unable to initialize camera", "error");
    }
  }
}

// =========================================
// CAMERA
// =========================================

async function startCamera() {
  setCameraStatus("Requesting camera");
  setStatus("Allow camera access to continue");

  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });

  if (pageClosed) {
    stopCamera();
    return;
  }

  video.muted = true;
  video.srcObject = stream;

  await video.play();

  if (pageClosed) {
    stopCamera();
    return;
  }

  video.style.opacity = "1";
  cameraPlaceholder.style.display = "none";
  scanLine.style.display = "";

  validSince = null;
  captured = false;
  lastVideoTime = -1;
  running = true;

  // Handle the camera being disconnected or permission revoked.
  stream.getVideoTracks().forEach((track) => {
    track.addEventListener("ended", () => {
      if (!running) return;

      stopCamera();
      setCameraStatus("Camera stopped");
      setStatus("Camera disconnected. Reload to try again.", "error");

      if (!detecting) disposeDetector();
    });
  });

  setCameraStatus("Camera ready");
  setStatus("Looking for a face...");

  animationFrameId = requestAnimationFrame(detectFaces);
}

// =========================================
// FACE DETECTION LOOP
// =========================================

async function detectFaces() {
  animationFrameId = null;

  if (!running || captured || pageClosed) return;

  // Avoid counting time while the tab is hidden.
  if (document.hidden) {
    validSince = null;
    animationFrameId = requestAnimationFrame(detectFaces);
    return;
  }

  // Wait for a usable, new video frame.
  if (
    video.readyState < 2 ||
    !video.videoWidth ||
    !video.videoHeight ||
    video.currentTime === lastVideoTime
  ) {
    animationFrameId = requestAnimationFrame(detectFaces);
    return;
  }

  lastVideoTime = video.currentTime;
  detecting = true;

  try {
    // TensorFlow.js inference is asynchronous.
    // Await completion before scheduling the next detection.
    // Match the video element dimensions to the actual camera stream.
    video.width = video.videoWidth;
    video.height = video.videoHeight;

    const faces = await faceDetector.estimateFaces(video, {
      flipHorizontal: false,
    });

    if (running && !captured && !pageClosed && !document.hidden) {
      processDetection(faces);
    } else {
      validSince = null;
    }
  } catch (error) {
    console.error("Face detection failed:", error);

    stopCamera();

    if (!pageClosed) {
      setCameraStatus("Detection stopped");
      setStatus("Detection failed. Reload to try again.", "error");
    }
  } finally {
    detecting = false;

    if (!running || pageClosed) {
      disposeDetector();
    }
  }

  if (running && !captured && !pageClosed) {
    animationFrameId = requestAnimationFrame(detectFaces);
  }
}

// =========================================
// PROCESS DETECTION RESULT
// =========================================

function processDetection(faces) {
  if (faces.length === 0) {
    validSince = null;
    setStatus("No face detected", "warning");
    return;
  }

  if (faces.length > 1) {
    validSince = null;
    setStatus("Only one face should be visible", "error");
    return;
  }

  // TensorFlow.js returns face.box, not face.boundingBox.
  const box = faces[0].box;

  if (
    !box ||
    ![box.xMin, box.yMin, box.width, box.height].every(Number.isFinite) ||
    box.width <= 0 ||
    box.height <= 0
  ) {
    validSince = null;
    setStatus("Unable to read face position", "warning");
    return;
  }

  const faceWidthRatio = box.width / video.videoWidth;
  const faceHeightRatio = box.height / video.videoHeight;

  if (faceWidthRatio < MIN_FACE_SIZE || faceHeightRatio < MIN_FACE_SIZE) {
    validSince = null;
    setStatus("Please move closer", "warning");
    return;
  }

  const faceCenterX = box.xMin + box.width / 2;
  const faceCenterY = box.yMin + box.height / 2;

  const horizontalOffset =
    Math.abs(faceCenterX - video.videoWidth / 2) / video.videoWidth;

  const verticalOffset =
    Math.abs(faceCenterY - video.videoHeight / 2) / video.videoHeight;

  const isCentered = horizontalOffset < 0.18 && verticalOffset < 0.2;

  if (!isCentered) {
    validSince = null;
    setStatus("Please center your face", "warning");
    return;
  }

  const now = performance.now();

  if (validSince === null) {
    validSince = now;
  }

  setStatus("Face detected — hold still", "success");

  if (now - validSince >= REQUIRED_STABLE_TIME && !captured) {
    capturePhoto();
  }
}

// =========================================
// CAPTURE PHOTO
// =========================================

function capturePhoto() {
  const canvas = document.createElement("canvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create the photo canvas.");
  }

  // Mirror the saved image to match the CSS-mirrored preview.
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const image = canvas.toDataURL("image/jpeg", 0.92);

  captured = true;
  downloadCapturedImage(image);
  stopCamera();

  scanLine.style.display = "none";

  setCameraStatus("Camera stopped");
  setStatus("Photo captured successfully", "success");
}

// =========================================
// DOWNLOAD TEST IMAGE
// =========================================

function downloadCapturedImage(image) {
  const link = document.createElement("a");

  link.href = image;
  link.download = `face-capture-${Date.now()}.jpg`;

  document.body.appendChild(link);
  link.click();
  link.remove();
}

// =========================================
// CLEANUP
// =========================================

function stopCamera() {
  running = false;
  validSince = null;

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  video.pause();
}

function disposeDetector() {
  if (faceDetector) {
    faceDetector.dispose();
    faceDetector = null;
  }
}

document.addEventListener("visibilitychange", () => {
  validSince = null;
});

window.addEventListener("pagehide", () => {
  pageClosed = true;

  stopCamera();

  // If inference is running, its finally block handles disposal.
  if (!detecting) {
    disposeDetector();
  }
});

// Reload if restored from the browser's back/forward cache.
window.addEventListener("pageshow", (event) => {
  if (event.persisted && pageClosed) {
    window.location.reload();
  }
});

// =========================================
// START
// =========================================

initializeFaceDetector();

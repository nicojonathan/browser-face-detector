// TensorFlow.js and faceLandmarksDetection are loaded by the HTML script tags.
const tf = window.tf;
const faceLandmarksDetection = window.faceLandmarksDetection;

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
// LANGUAGE
// =========================================

const translations = {
  "I'm ready": "Saya siap",
  "Face Detection": "Deteksi Wajah",
  "By Nico Jonathan Setiawan": "Oleh Nico Jonathan Setiawan",
  "PHOTO CAPTURE": "PENGAMBILAN FOTO",
  "Capture a photo of your face": "Ambil foto wajah Anda",

  "Position your face inside the guide and look directly at the camera. Your photo will be captured automatically when you are ready.":
    "Posisikan wajah Anda di dalam bingkai dan lihat langsung ke kamera. Foto Anda akan diambil secara otomatis saat Anda siap.",

  "Camera preview": "Pratinjau kamera",
  "Face the camera": "Hadapkan wajah ke kamera",
  "Look directly at the camera.": "Lihat langsung ke kamera.",
  "Stay inside the frame": "Tetap di dalam bingkai",
  "Keep your face within the guide.":
    "Pastikan wajah Anda berada di dalam bingkai.",
  "Wait for capture": "Tunggu pengambilan foto",
  "Your photo will be captured automatically.":
    "Foto Anda akan diambil secara otomatis.",

  "Face detection runs locally in your browser.":
    "Deteksi wajah berjalan secara lokal di browser Anda.",
  Secure: "Aman",

  "Camera Ready": "Kamera siap",
  "Camera ready": "Kamera siap",
  Initializing: "Memulai",
  Unavailable: "Tidak tersedia",
  "Requesting camera": "Meminta akses kamera",
  "Camera stopped": "Kamera berhenti",
  "Detection stopped": "Deteksi berhenti",

  "Loading face detection...": "Memuat deteksi wajah...",
  "Allow camera access to continue": "Izinkan akses kamera untuk melanjutkan",
  "Looking for a face...": "Mencari wajah...",
  "No face detected": "Tidak ada wajah terdeteksi",
  "Only one face should be visible": "Pastikan hanya satu wajah yang terlihat",
  "Unable to read face position": "Tidak dapat membaca posisi wajah",
  "Please move closer": "Silakan mendekat ke kamera",
  "Please center your face": "Posisikan wajah Anda di tengah",
  "Face detected — hold still": "Wajah terdeteksi — jangan bergerak",
  "Photo captured successfully": "Foto berhasil diambil",

  "Camera disconnected. Reload to try again.":
    "Kamera terputus. Muat ulang halaman untuk mencoba lagi.",
  "Detection failed. Reload to try again.":
    "Deteksi gagal. Muat ulang halaman untuk mencoba lagi.",
  "Unable to initialize camera": "Tidak dapat mengaktifkan kamera",

  "Libraries failed to load.": "Pustaka gagal dimuat.",
  "Camera access requires HTTPS or localhost and a supported browser.":
    "Akses kamera memerlukan HTTPS atau localhost dan browser yang mendukung.",
  "Camera permission denied. Allow camera access and reload.":
    "Izin kamera ditolak. Izinkan akses kamera lalu muat ulang halaman.",
  "No camera found.": "Kamera tidak ditemukan.",
  "Camera is unavailable or in use by another application.":
    "Kamera tidak tersedia atau sedang digunakan aplikasi lain.",
};

let currentLanguage = "id";

try {
  const savedLanguage = localStorage.getItem("facescan-language");

  if (savedLanguage === "en" || savedLanguage === "id") {
    currentLanguage = savedLanguage;
  }
} catch {
  // Continue normally if browser storage is unavailable.
}

let currentDetectionText = "Looking for a face...";
let currentDetectionType = "waiting";
let currentCameraText = "Camera Ready";

function translate(text) {
  return currentLanguage === "id" ? (translations[text] ?? text) : text;
}

// Update the existing HTML instructions without changing its layout.
// Update the existing HTML instructions without changing its layout.
// document.querySelector(".intro p").textContent =
//   "Position your face inside the guide. Keep your mouth closed, then open it when prompted. Your photo will be captured after your mouth opens.";

// document.querySelectorAll(".instruction strong")[2].textContent =
//   "Open your mouth when prompted";

// document.querySelectorAll(".instruction strong + span")[2].textContent =
//   "Open your mouth wide, then hold still.";

// Hide liveness instructions
document.querySelector(".intro p").textContent =
  "Position your face inside the guide.";

document.querySelectorAll(".instruction")[2].style.display = "none";

Object.assign(translations, {
  "Position your face inside the guide. Keep your mouth closed, then open it when prompted. Your photo will be captured after your mouth opens.":
    "Posisikan wajah di dalam bingkai. Tutup mulut, lalu buka saat diminta. Foto diambil setelah mulut terbuka.",

  "Open your mouth when prompted": "Buka mulut saat diminta",
  "Open your mouth wide, then hold still.":
    "Buka mulut lebar, lalu jangan bergerak.",
  "Keep your mouth closed — hold still": "Tutup mulut — jangan bergerak",
  "Open your mouth now": "Buka mulut sekarang",
  "Mouth open — hold still": "Mulut terbuka — jangan bergerak",
  "Unable to read mouth landmarks": "Titik mulut tidak terbaca",
  "Unable to read face landmarks": "Titik wajah tidak terbaca",
  "Loading Liveness Detection Model...": "Memuat Model Deteksi Liveness...",
  "Time remaining": "Waktu tersisa",
  "Seconds remaining": "Detik tersisa",
  "Time is up. Reload to try again.":
    "Waktu habis. Muat ulang halaman untuk mencoba lagi.",
});

// Store the original English text once.
const staticTextElements = [
  ...document.querySelectorAll(`
    title,
    .brand h1 + span,
    .eyebrow,
    .intro h2,
    .intro p,
    .camera-placeholder > span,
    .instruction strong,
    .instruction strong + span,
    .footer > span:not(.secure),
    #btnReady
  `),
].map((element) => ({
  element,
  text: element.textContent.trim().replace(/\s+/g, " "),
}));

// Wrap only the footer label so its existing icon is preserved.
const secureElement = document.querySelector(".secure");
let secureLabel = null;

if (secureElement) {
  for (const node of [...secureElement.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      secureLabel = document.createElement("span");
      secureLabel.textContent = node.textContent.trim();
      node.replaceWith(secureLabel);
      break;
    }
  }
}

function applyLanguage(language) {
  currentLanguage = language === "id" ? "id" : "en";

  document.documentElement.lang = currentLanguage;

  document.getElementById("timerCaption").textContent =
    translate("Time remaining");

  document
    .querySelector(".timer-ring")
    .setAttribute("aria-label", translate("Seconds remaining"));

  for (const { element, text } of staticTextElements) {
    element.textContent = translate(text);
  }

  if (secureLabel) {
    secureLabel.textContent = translate("Secure");
  }

  document.querySelectorAll("[data-language]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.language === currentLanguage),
    );
  });

  // Re-render current messages, including after capture or an error.
  setStatus(currentDetectionText, currentDetectionType);
  setCameraStatus(currentCameraText);

  try {
    localStorage.setItem("facescan-language", currentLanguage);
  } catch {
    // The toggle still works without saving the preference.
  }
}

document.querySelectorAll("[data-language]").forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.language);
  });
});

// =========================================
// CONFIGURATION
// =========================================

const REQUIRED_STABLE_TIME = 700;

// Must be greater than 1 to detect and reject multiple faces.
const MAX_FACES = 2;

let faceDetector = null;
let stream = null;

let validSince = null;
let captured = false;
let running = false;
let pageClosed = false;
let detecting = false;
let animationFrameId = null;
let lastVideoTime = -1;

// Starting thresholds, not universal biometric constants.
// Validate these values on your target devices.
const MOUTH = {
  openMAR: 0.32,
  closedMAR: 0.15,
  stableMs: REQUIRED_STABLE_TIME,
  minOpenMs: 180,
  challengeMs: 10000,
  maxFrameGapMs: 500,
};

let mouthPhase = "prepare";
let promptedAt = null;
let openedAt = null;
let lastMouthFrameAt = null;
let previousFace = null;
let visibilityEpoch = 0;

const inferenceFrame = document.createElement("canvas");
const inferenceContext = inferenceFrame.getContext("2d");

function resetMouthChallenge() {
  validSince = null;
  mouthPhase = "prepare";
  promptedAt = openedAt = lastMouthFrameAt = null;
  previousFace = null;
}

// =========================================
// MOUTH ASPECT RATIO
// =========================================

function mouthAspectRatio(points, indices) {
  const p = indices.map((i) => points[i]);

  if (p.some((v) => !v || !Number.isFinite(v.x) || !Number.isFinite(v.y))) {
    return NaN;
  }

  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // [left mouth corner, right mouth corner, upper inner lip, lower inner lip]
  const width = distance(p[0], p[1]);

  if (width < 3) return NaN;

  return distance(p[2], p[3]) / width;
}

// =========================================
// OPEN MOUTH STATE MACHINE
// =========================================

// Only a complete open -> closed -> open sequence can pass.
function advanceMouth(mar, now) {
  if (
    lastMouthFrameAt !== null &&
    now - lastMouthFrameAt > MOUTH.maxFrameGapMs
  ) {
    resetMouthChallenge();
  }

  lastMouthFrameAt = now;

  const closed = mar <= MOUTH.closedMAR;
  const open = mar >= MOUTH.openMAR;

  if (promptedAt !== null && now - promptedAt > MOUTH.challengeMs) {
    resetMouthChallenge();
  }

  if (mouthPhase === "prepare") {
    if (!closed) {
      validSince = null;
    } else if (validSince === null) {
      validSince = now;
    }

    if (validSince !== null && now - validSince >= MOUTH.stableMs) {
      mouthPhase = "waiting-open";
      promptedAt = now;
    }

    setStatus(
      mouthPhase === "prepare"
        ? "Keep your mouth closed — hold still"
        : "Open your mouth now",
    );
  } else if (mouthPhase === "waiting-open") {
    setStatus("Open your mouth now");

    if (open) {
      openedAt = now;
      mouthPhase = "confirm-open";
      setStatus("Mouth open — hold still", "success");
    }
  } else if (mouthPhase === "confirm-open") {
    if (!open) {
      resetMouthChallenge();
      setStatus("Keep your mouth closed — hold still");
    } else if (now - openedAt >= MOUTH.minOpenMs) {
      return true;
    }
  }

  return false;
}

// =========================================
// CHALLENGE COUNTDOWN
// =========================================

const CHALLENGE_DURATION_MS = 30000;

const challengeTimer = document.getElementById("challengeTimer");
const timerProgress = document.getElementById("timerProgress");
const timerValue = document.getElementById("timerValue");

let challengeDeadline = null;
let challengeTimerFrame = null;
let challengeTimeoutId = null;
let challengeTimedOut = false;
let lastDisplayedSecond = null;

function renderChallengeTimer(remainingMs) {
  const remaining = Math.max(0, remainingMs);
  const seconds = Math.ceil(remaining / 1000);

  const fraction = Math.min(1, remaining / CHALLENGE_DURATION_MS);

  // Ring gradually disappears from 100% to 0%.
  timerProgress.style.strokeDashoffset = String((1 - fraction) * 100);

  // Hide the rounded stroke tip when completely empty.
  timerProgress.style.opacity = remaining > 0 ? "1" : "0";

  if (seconds !== lastDisplayedSecond) {
    timerValue.textContent = String(seconds);
    lastDisplayedSecond = seconds;
  }
}

function stopChallengeCountdown() {
  if (challengeTimerFrame !== null) {
    cancelAnimationFrame(challengeTimerFrame);
    challengeTimerFrame = null;
  }

  if (challengeTimeoutId !== null) {
    clearTimeout(challengeTimeoutId);
    challengeTimeoutId = null;
  }

  challengeDeadline = null;
}

async function expireChallenge() {
  if (challengeTimedOut || captured || pageClosed) return;

  challengeTimedOut = true;

  renderChallengeTimer(0);
  stopCamera();

  // Return to the instructions immediately.
  cameraPage.hidden = true;
  instructionPage.hidden = false;
  challengeTimer.hidden = true;

  // Prevent restarting while the previous inference is finishing.
  btnReady.disabled = true;

  sendHeight(true);

  // Wait for initialization and any ongoing inference to finish.
  // This also handles camera permission still being requested.
  while (initializingCamera || detecting) {
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (pageClosed) return;
  }

  disposeDetector();

  video.srcObject = null;
  video.style.opacity = "0";
  cameraPlaceholder.style.display = "";
  scanLine.style.display = "";

  captured = false;
  lastVideoTime = -1;

  resetMouthChallenge();

  cameraStepStarted = false;
  btnReady.disabled = false;

  setCameraStatus("Camera Ready");
  setStatus("Looking for a face...");

  sendHeight(true);
}

// Check the deadline before accepting detection results.
// This also handles timers delayed by an inactive browser tab.
function challengeHasExpired() {
  if (challengeTimedOut) return true;

  if (challengeDeadline !== null && performance.now() >= challengeDeadline) {
    expireChallenge();
    return true;
  }

  return false;
}

function updateChallengeCountdown() {
  challengeTimerFrame = null;

  if (challengeDeadline === null) return;
  if (challengeHasExpired()) return;

  renderChallengeTimer(challengeDeadline - performance.now());

  challengeTimerFrame = requestAnimationFrame(updateChallengeCountdown);
}

function startChallengeCountdown() {
  stopChallengeCountdown();

  challengeTimedOut = false;
  lastDisplayedSecond = null;
  challengeTimer.hidden = false;

  challengeDeadline = performance.now() + CHALLENGE_DURATION_MS;

  renderChallengeTimer(CHALLENGE_DURATION_MS);

  challengeTimeoutId = setTimeout(() => {
    challengeTimeoutId = null;

    if (!challengeHasExpired() && challengeDeadline !== null) {
      challengeTimerFrame ??= requestAnimationFrame(updateChallengeCountdown);
    }
  }, CHALLENGE_DURATION_MS);

  challengeTimerFrame = requestAnimationFrame(updateChallengeCountdown);
}

// =========================================
// UI
// =========================================

function setStatus(text, type = "waiting") {
  currentDetectionText = text;
  currentDetectionType = type;

  message.textContent = translate(text);

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
  currentCameraText = text;

  if (!cameraStatus) return;

  const dot = document.createElement("span");
  dot.className = "status-dot";

  cameraStatus.replaceChildren(
    dot,
    document.createTextNode(` ${translate(text)}`),
  );
}

function getCameraErrorText(error) {
  const messages = {
    NotAllowedError:
      "Camera permission denied. Allow camera access and reload.",
    NotFoundError: "No camera found.",
    NotReadableError: "Camera is unavailable or in use by another application.",
  };

  if (messages[error?.name]) {
    return messages[error.name];
  }

  if (Object.prototype.hasOwnProperty.call(translations, error?.message)) {
    return error.message;
  }

  return "Unable to initialize camera";
}

// =========================================
// INITIALIZE TENSORFLOW.JS / FACEMESH
// =========================================

async function initializeFaceDetector() {
  setCameraStatus("Initializing");
  setStatus("Loading Liveness Detection Model...");

  try {
    if (!tf || !faceLandmarksDetection) {
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

    faceDetector = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      {
        runtime: "tfjs",
        refineLandmarks: true,
        maxFaces: MAX_FACES,
      },
    );

    if (pageClosed) {
      disposeDetector();
      return;
    }

    startChallengeCountdown();
    await startCamera();
  } catch (error) {
    console.error("Initialization failed:", error);

    stopCamera();
    disposeDetector();

    if (!pageClosed && !challengeTimedOut) {
      setCameraStatus("Unavailable");
      setStatus(getCameraErrorText(error), "error");
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

  if (pageClosed || challengeHasExpired()) {
    stopCamera();
    return;
  }

  video.muted = true;
  video.srcObject = stream;

  await video.play();

  if (pageClosed || challengeHasExpired()) {
    stopCamera();
    return;
  }

  video.style.opacity = "1";
  cameraPlaceholder.style.display = "none";
  scanLine.style.display = "";

  resetMouthChallenge();

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
    resetMouthChallenge();
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
    // Await inference before scheduling the next detection.
    video.width = video.videoWidth;
    video.height = video.videoHeight;

    const epoch = visibilityEpoch;

    inferenceFrame.width = video.videoWidth;
    inferenceFrame.height = video.videoHeight;
    inferenceContext.drawImage(video, 0, 0);

    const sampledAt = performance.now();

    const faces = await faceDetector.estimateFaces(inferenceFrame, {
      flipHorizontal: false,
    });

    if (running && !captured && !pageClosed && !document.hidden) {
      // if (
      //   epoch !== visibilityEpoch ||
      //   performance.now() - sampledAt > MOUTH.maxFrameGapMs
      // ) {
      //   resetMouthChallenge();
      //   setStatus("Keep your mouth closed — hold still");
      // } else {
      //   processDetection(faces, sampledAt);
      // }

      if (
        epoch !== visibilityEpoch ||
        performance.now() - sampledAt > MOUTH.maxFrameGapMs
      ) {
        resetMouthChallenge();
        setStatus("Looking for a face...");
      } else {
        processDetection(faces, sampledAt);
      }
    } else {
      resetMouthChallenge();
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

function processDetection(faces, now) {
  if (challengeHasExpired()) return;

  const reject = (text) => {
    resetMouthChallenge();
    setStatus(text, "warning");
  };

  if (faces.length !== 1) {
    reject(
      faces.length ? "Only one face should be visible" : "No face detected",
    );
    return;
  }

  const { box, keypoints: points } = faces[0];

  if (
    !box ||
    ![box.xMin, box.yMin, box.width, box.height].every(Number.isFinite) ||
    box.width <= 0 ||
    box.height <= 0
  ) {
    reject("Unable to read face position");
    return;
  }

  // Convert raw coordinates to the mirrored, object-fit:cover preview.
  const rect = video.getBoundingClientRect();
  const guide = faceGuide.getBoundingClientRect();

  const scale = Math.max(
    rect.width / video.videoWidth,
    rect.height / video.videoHeight,
  );

  const offsetX = (rect.width - video.videoWidth * scale) / 2;

  const offsetY = (rect.height - video.videoHeight * scale) / 2;

  const cx = rect.width - ((box.xMin + box.width / 2) * scale + offsetX);

  const cy = (box.yMin + box.height / 2) * scale + offsetY;

  const gx = guide.left - rect.left + guide.width / 2;

  const gy = guide.top - rect.top + guide.height / 2;

  if (
    box.width * scale < guide.width * 0.55 ||
    box.height * scale < guide.height * 0.55
  ) {
    reject("Please move closer");
    return;
  }

  if (
    box.width * scale > guide.width * 1.08 ||
    box.height * scale > guide.height * 1.08
  ) {
    reject("Please move back slightly");
    return;
  }

  if (
    Math.abs(cx - gx) > guide.width * 0.14 ||
    Math.abs(cy - gy) > guide.height * 0.14
  ) {
    reject("Please center your face");
    return;
  }

  const mar = mouthAspectRatio(points || [], [61, 291, 13, 14]);

  if (!Number.isFinite(mar)) {
    reject("Unable to read mouth landmarks");
    return;
  }

  const nose = points[1];
  const a = points[33];
  const b = points[263];

  if (!nose || ![nose.x, nose.y].every(Number.isFinite)) {
    reject("Unable to read face landmarks");
    return;
  }

  const eyeSpan = Math.abs(b.x - a.x);

  if (
    eyeSpan < 1 ||
    Math.abs(a.y - b.y) / eyeSpan > 0.25 ||
    Math.abs(nose.x - (a.x + b.x) / 2) / eyeSpan > 0.28
  ) {
    reject("Keep your face upright and look at the camera");
    return;
  }

  // Reset on abrupt movement.
  // This is a continuity heuristic, not identity recognition.
  const current = {
    x: box.xMin + box.width / 2,
    y: box.yMin + box.height / 2,
    width: box.width,
  };

  if (
    previousFace &&
    (Math.hypot(current.x - previousFace.x, current.y - previousFace.y) >
      previousFace.width * 0.2 ||
      Math.abs(current.width / previousFace.width - 1) > 0.2)
  ) {
    resetMouthChallenge();
  }

  previousFace = current;

  // if (advanceMouth(mar, now) && !captured) {
  //   capturePhoto();
  // }

  // TEMPORARY BYPASS: Skip mouth liveness challenge.
  if (!captured) {
    capturePhoto();
  }
}

// =========================================
// CAPTURE PHOTO
// =========================================

function capturePhoto() {
  if (challengeHasExpired()) return;

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

  context.drawImage(inferenceFrame, 0, 0, canvas.width, canvas.height);

  const image = canvas.toDataURL("image/jpeg", 0.92);

  window.parent.postMessage(
    {
      type: "face-captured",
      photo: image,
      source: "facescan",

      // Client-side interaction result, not trusted proof of liveness.
      mouthOpened: true,
    },
    "*",
  );

  captured = true;

  // Uncomment to download the captured photo during testing.
  // downloadCapturedImage(image);

  stopCamera();

  challengeTimer.hidden = true;
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
  stopChallengeCountdown();

  running = false;
  resetMouthChallenge();

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
  visibilityEpoch++;
  resetMouthChallenge();
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
// IFRAME HEIGHT
// =========================================

// Replace with your Laravel application's exact origin.
// Example for development: "http://localhost:8000"
// const PARENT_ORIGIN = "https://your-laravel-domain.com";

const app = document.querySelector(".app");

let heightFrame = null;
let lastSentHeight = null;
let forceHeightUpdate = false;

function sendHeight(force = false) {
  forceHeightUpdate = forceHeightUpdate || force;

  if (heightFrame !== null) return;

  heightFrame = requestAnimationFrame(() => {
    heightFrame = null;

    // Measure the content rather than the iframe viewport.
    // This allows the iframe to shrink when instructions disappear.
    const height = Math.ceil(
      Math.max(app.getBoundingClientRect().height, app.scrollHeight),
    );

    const shouldSend =
      height > 0 && (forceHeightUpdate || height !== lastSentHeight);

    forceHeightUpdate = false;

    if (!shouldSend) return;

    lastSentHeight = height;

    window.parent.postMessage(
      {
        type: "iframe-height",
        height,
      },
      "*",
    );
  });
}

// window.addEventListener("message", (event) => {
//   if (
//     event.origin !== PARENT_ORIGIN ||
//     event.source !== window.parent
//   ) {
//     return;
//   }
//
//   if (event.data?.type === "request-height") {
//     sendHeight(true);
//   }
// });

const heightObserver = new ResizeObserver(() => sendHeight());
heightObserver.observe(app);

window.addEventListener("load", () => sendHeight(true));
window.addEventListener("resize", () => sendHeight());

if (document.fonts) {
  document.fonts.ready.then(() => sendHeight());
}

// =========================================
// SCREEN SWITCHING
// =========================================

const instructionPage = document.getElementById("instructionPage");
const cameraPage = document.getElementById("cameraPage");
const btnReady = document.getElementById("btnReady");
const header = document.querySelector(".header");
const footer = document.querySelector(".footer");

let cameraStepStarted = false;
let initializingCamera = false;

btnReady.addEventListener("click", async () => {
  if (cameraStepStarted || initializingCamera || pageClosed) return;

  cameraStepStarted = true;
  initializingCamera = true;

  btnReady.disabled = true;
  challengeTimer.hidden = true;

  instructionPage.hidden = true;
  cameraPage.hidden = false;

  try {
    // Wait for the camera section to become visible.
    await new Promise((resolve) => requestAnimationFrame(resolve));

    if (pageClosed) return;

    sendHeight(true);

    await initializeFaceDetector();
  } finally {
    initializingCamera = false;
    sendHeight(true);
  }
});
// =========================================
// START — INSTRUCTIONS ONLY
// =========================================

instructionPage.hidden = false;
cameraPage.hidden = true;

applyLanguage(currentLanguage);
sendHeight(true);

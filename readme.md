# Browser Face Liveness Detection Widget

A secure, browser-based face capture and liveness detection module built with **JavaScript**, **TensorFlow.js**, and **MediaPipe FaceMesh**. 

This project is designed to be embedded as an `iframe` (e.g., within a Laravel application) to securely capture user photos. It uses the user's webcam to detect a face in real-time and enforces an active **liveness challenge** (opening the mouth) to prevent spoofing attacks (such as holding up a static photo).

## ✨ Features

- 📷 **Real-time Webcam Access:** Seamless integration with the MediaDevices API.
- 🙂 **Client-side Processing:** All face detection and liveness validation happen directly in the browser.
- 👤 **Strict Face Validation:** Ensures exactly one face is visible, properly centered, upright, and within the designated bounding box.
- 👄 **Active Liveness Detection:** Utilizes a Mouth Aspect Ratio (MAR) state machine. The user must keep their mouth closed, and then open it when prompted.
- ⏱️ **Timeout & Continuity Checks:** Includes a 30-second challenge timer and frame-gap detection to reset the challenge if the user moves too fast or switches tabs.
- 🌐 **Bilingual Support:** Built-in translations for English and Indonesian.
- 🔗 **Iframe Integration:** Communicates securely with the parent window using the `postMessage` API.

## 🛠️ Tech Stack

- **HTML5 & CSS3**
- **JavaScript (ES6+)**
- **TensorFlow.js** 
- **MediaPipe FaceMesh** (`@tensorflow-models/face-landmarks-detection`)
- **WebRTC / MediaDevices API**
- **HTML Canvas API**
- **Window PostMessage API** (for iframe communication)

## 🔄 How It Works

The application follows a strict validation and liveness flow:

```text
Webcam
   ↓
HTML <video> (Mirrored Preview)
   ↓
TensorFlow.js + MediaPipe FaceMesh (Inference)
   ↓
Face detected?
   │
   ├── No → Show warning
   │
   └── Yes → Extract Bounding Box & Landmarks
        ↓
   Validate Face Geometry
        ↓
   ┌─────────────────────────────────────────┐
   │ Exactly one face?                       │
   │ Face large enough & not too close?      │
   │ Face properly centered in the guide?    │
   │ Face is upright (eyes & nose aligned)?  │
   └─────────────────────────────────────────┘
        ↓
   Liveness Challenge (State Machine)
        ↓
   ┌─────────────────────────────────────────┐
   │ 1. "Prepare": Mouth closed & stable?    │
   │ 2. "Waiting-Open": Prompt user to open  │
   │ 3. "Confirm-Open": Is mouth open (MAR)? │
   └─────────────────────────────────────────┘
        ↓
   Challenge Passed (Liveness Verified)
        ↓
   Capture Frame → HTML Canvas → JPEG Base64
        ↓
   Send to Parent App via window.parent.postMessage

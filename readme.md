# Browser Face Detector

A browser-based face detection prototype built with **JavaScript** and **MediaPipe**.

The project uses the user's webcam to detect a face in real time. When a valid face is detected and remains stable for a short period, the application automatically captures an image from the video stream.

## ✨ Features

- 📷 Real-time webcam access
- 🙂 Face detection directly in the browser
- 🎯 Detects whether a face is properly positioned
- 👤 Ensures only one face is visible
- 📏 Checks whether the face is large enough
- ⏱️ Waits for a stable detection before capturing
- 📸 Automatically captures the detected face
- 🔒 No backend required — processing happens in the browser

## 🛠️ Tech Stack

- **HTML5**
- **CSS3**
- **JavaScript**
- **MediaPipe Tasks Vision**
- **WebRTC / MediaDevices API**
- **HTML Canvas API**

## 🔄 How It Works

The application follows this basic flow:

```text
Webcam
   ↓
HTML <video>
   ↓
MediaPipe Face Detector
   ↓
Face detected?
   │
   ├── No → Show warning
   │
   └── Yes
        ↓
   Validate face
        ↓
   ┌─────────────────────────────┐
   │ Exactly one face?           │
   │ Face large enough?          │
   │ Face properly centered?     │
   └─────────────────────────────┘
        ↓
   Valid & stable
        ↓
   Capture frame
        ↓
   HTML Canvas
        ↓
   Image
```

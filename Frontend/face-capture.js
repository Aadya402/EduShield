document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startCameraButton = document.getElementById('start-camera-btn');
    const captureButton = document.getElementById('capture-btn');
    const recaptureButton = document.getElementById('recapture-btn');
    const video = document.getElementById('video-feed');
    const capturedImagePreview = document.getElementById('captured-image-preview');
    const faceCaptureDataInput = document.getElementById('face-capture-data');
    const statusMessage = document.getElementById('status-message');

    // --- UI Containers ---
    const instructionsUI = document.getElementById('capture-instructions');
    const videoUI = document.getElementById('video-container');
    const successUI = document.getElementById('capture-success');

    let stream = null; // To hold the camera stream

    // --- 1. Start Camera ---
    async function startCamera() {
        try {
            // Get camera stream
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            video.srcObject = stream;
            video.play();

            // Update UI
            instructionsUI.classList.add('hidden');
            successUI.classList.add('hidden');
            videoUI.classList.remove('hidden');
            statusMessage.textContent = 'Position your face in the frame and click capture.';
        } catch (err) {
            console.error("Error accessing camera:", err);
            statusMessage.textContent = "Could not access camera. Please allow permission.";
        }
    }

    // --- 2. Capture Photo ---
    function capturePhoto() {
        if (!stream) return;

        // Create a canvas to draw the video frame on
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert the canvas to a Base64 JPEG image
        const imageDataUrl = canvas.toDataURL('image/jpeg');

        // Store the image data in the hidden form field for submission
        faceCaptureDataInput.value = imageDataUrl;

        // Show the captured image to the user
        capturedImagePreview.src = imageDataUrl;

        // Update UI
        videoUI.classList.add('hidden');
        successUI.classList.remove('hidden');
        statusMessage.textContent = 'Face captured successfully!';

        // Stop the camera stream to turn the light off
        stream.getTracks().forEach(track => track.stop());
    }

    // --- Event Listeners ---
    startCameraButton.addEventListener('click', startCamera);
    captureButton.addEventListener('click', capturePhoto);
    recaptureButton.addEventListener('click', startCamera); // Recapture just restarts the camera
});


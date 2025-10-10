document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-camera-btn');
    const captureButton = document.getElementById('capture-btn');
    const recaptureButton = document.getElementById('recapture-btn');
    const video = document.getElementById('video-feed');
    const capturedImagePreview = document.getElementById('captured-image-preview');
    const statusMessage = document.getElementById('status-message');
    const faceCaptureDataInput = document.getElementById('face-capture-data');
    const overlay = document.getElementById('liveness-overlay');
    
    // UI Containers
    const instructionsUI = document.getElementById('capture-instructions');
    const videoUI = document.getElementById('video-container');
    const successUI = document.getElementById('capture-success');
    let stream = null;
    // Main function to start the whole process
    async function startLivenessCheck() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            video.srcObject = stream;
            video.play();

            instructionsUI.classList.add('hidden');
            successUI.classList.add('hidden');
            videoUI.classList.remove('hidden');
            captureButton.classList.add('hidden'); 
            statusMessage.textContent = 'Get ready...';
            setTimeout(performFlashSequence, 1500);

        } catch (err) {
            console.error("Error accessing camera:", err);
            statusMessage.textContent = "Could not access camera. Please allow permission.";
        }
    }

    function captureSnapshot() {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg');
    }

    async function performFlashSequence() {
        const captures = {};
        // Frame 1: Flash Blue
        overlay.style.backgroundColor = 'rgba(0, 0, 255, 0.7)';
        overlay.classList.remove('hidden');
        statusMessage.textContent = 'Hold Still...';
        await new Promise(resolve => setTimeout(resolve, 300));
        captures.blue_tint = captureSnapshot();
        
        // Frame 2: Flash Green
        overlay.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
        await new Promise(resolve => setTimeout(resolve, 300));
        captures.green_tint = captureSnapshot();

        // Sequence finished
        overlay.classList.add('hidden');
        stream.getTracks().forEach(track => track.stop());
        faceCaptureDataInput.value = JSON.stringify(captures);
        capturedImagePreview.src = captures.green_tint; 
        successUI.classList.remove('hidden');
        statusMessage.textContent = 'Liveness check complete!';
    }

    // --- Event Listeners ---
    startButton.addEventListener('click', startLivenessCheck);
    recaptureButton.addEventListener('click', () => {
        successUI.classList.add('hidden');
        instructionsUI.classList.remove('hidden');
    });
});




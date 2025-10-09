// Add this log to confirm the file is loading
console.log("fingerprint.js script has been loaded and is running.");


async function generateDeviceFingerprint() {
    console.log("Step 1: Starting generateDeviceFingerprint function.");


    try {
        // --- Gather basic browser and screen data ---
        const userAgent = navigator.userAgent;
        const screenResolution = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;
        console.log("Step 2: Basic browser data collected.", { userAgent, screenResolution, timezone, language });


        // --- Canvas Fingerprinting ---
        const getCanvasHash = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const text = "EduShield_v1.0";
                ctx.textBaseline = "top";
                ctx.font = "14px 'Arial'";
                ctx.textBaseline = "alphabetic";
                ctx.fillStyle = "#f60";
                ctx.fillRect(125, 1, 62, 20);
                ctx.fillStyle = "#069";
                ctx.fillText(text, 2, 15);
                ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
                ctx.fillText(text, 4, 17);
                const dataUrl = canvas.toDataURL();
                console.log("Step 3: Canvas fingerprint generated successfully.");
                return dataUrl;
            } catch (canvasError) {
                // This will catch errors specifically from the canvas part
                console.error("INTERNAL ERROR in getCanvasHash:", canvasError);
                return 'canvas-error';
            }
        };


        const canvasHash = getCanvasHash();


        // --- Combine and Hash Data ---
        const dataToHash = JSON.stringify({
            userAgent,
            screenResolution,
            timezone,
            language,
            canvasHash,
        });
        console.log("Step 4: Combined all data points for hashing.");


        const encoder = new TextEncoder();
        const data = encoder.encode(dataToHash);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);


        // This is the corrected line
        // const hashArray = Array.from(new Uint8Array(hashBuffer));
        // const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const hashArray = Array.from(new Uint8Array(hashBuffer)); // Corrected from UintArray
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
       
        console.log("Step 5: SUCCESS! Final fingerprint hash:", hashHex);
        return hashHex;


    } catch (error) {
        // This will catch any other error in the main function
        console.error("CRITICAL ERROR in generateDeviceFingerprint:", error);
        // Return null so we know it failed
        return null;
    }
}

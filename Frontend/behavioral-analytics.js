// behavioral-analytics.js

// This object will store and manage the behavioral data for each form input.
const behavioralDataTracker = {
    // Stores metrics for each input field by its ID
    fieldMetrics: {},
    // The list of input field IDs we want to track
    fieldsToTrack: [
        'full-name', 'email', 'phone-number', 'pan-number', 
        'aadhar-number', 'state', 'city', 'applicant-income', 
        'credit-score', 'loan-amount', 'loan-term'
    ],

    // Call this method to start tracking all specified fields
    initialize: function() {
        console.log("Behavioral Analytics Tracker Initialized.");
        this.fieldsToTrack.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                // Reset data structure for the field
                this.resetFieldMetrics(fieldId);

                // Attach event listeners
                element.addEventListener('focus', () => this.handleFocus(fieldId));
                element.addEventListener('blur', () => this.handleBlur(fieldId));
                element.addEventListener('keydown', (e) => this.handleKeydown(fieldId, e));
            }
        });
    },

    // Sets up the initial data structure for a field
    resetFieldMetrics: function(fieldId) {
        this.fieldMetrics[fieldId] = {
            hesitationTime: null, // Time before the first keypress
            duration: 0,          // Total time spent typing in the field
            keypressCount: 0,
            correctionCount: 0,   // Backspaces or Deletes
            startTime: null,      // Timestamp when field gets focus
            firstKeyTime: null,   // Timestamp of the very first keypress
        };
    },

    // When a user clicks into a field
    handleFocus: function(fieldId) {
        const field = this.fieldMetrics[fieldId];
        // Start the timer only if it's the first time focusing
        if (!field.startTime) {
            field.startTime = performance.now();
        }
    },

    // When a user leaves a field
    handleBlur: function(fieldId) {
        const field = this.fieldMetrics[fieldId];
        if (field.startTime && field.firstKeyTime) {
            // Calculate total duration spent in the field
            field.duration = performance.now() - field.firstKeyTime;
        }
    },

    // When a user presses a key
    handleKeydown: function(fieldId, event) {
        const field = this.fieldMetrics[fieldId];
        
        // Capture the hesitation time on the very first keypress
        if (!field.firstKeyTime) {
            field.firstKeyTime = performance.now();
            field.hesitationTime = field.firstKeyTime - field.startTime;
        }

        // Increment keypress count
        field.keypressCount++;
        
        // Check for corrections (Backspace or Delete keys)
        if (event.key === 'Backspace' || event.key === 'Delete') {
            field.correctionCount++;
        }
    },

    // In behavioral-analytics.js

// This function calculates final metrics and returns a summary object
// REPLACE your existing getMetrics function with this one.
getMetrics: function() {
    const totalMetrics = {
        totalTypingDuration: 0,
        totalKeyPresses: 0,
        totalCorrections: 0,
        averageHesitationTime: 0,
        averageWPM: 0 // Will be calculated at the end
    };

    let totalHesitation = 0;
    let validFieldsForHesitation = 0;
    
    // --- NEW: Variables for the robust WPM calculation ---
    let totalCharactersTyped = 0;

    for (const fieldId in this.fieldMetrics) {
        const field = this.fieldMetrics[fieldId];
        const element = document.getElementById(fieldId);

        // Aggregate totals for all fields
        totalMetrics.totalTypingDuration += field.duration;
        totalMetrics.totalKeyPresses += field.keypressCount;
        totalMetrics.totalCorrections += field.correctionCount;
        
        if (element) {
            totalCharactersTyped += element.value.length;
        }
        
        if (field.hesitationTime) {
            totalHesitation += field.hesitationTime;
            validFieldsForHesitation++;
        }
    }
    
    // --- CALCULATE AVERAGES AFTER THE LOOP ---

    // Calculate average hesitation time
    if (validFieldsForHesitation > 0) {
        totalMetrics.averageHesitationTime = totalHesitation / validFieldsForHesitation;
    }

    // Calculate robust average WPM using totals
    if (totalMetrics.totalTypingDuration > 0 && totalCharactersTyped > 0) {
        // A "word" is standardized as 5 characters
        const totalWordsTyped = totalCharactersTyped / 5;
        // Convert total duration from milliseconds to minutes
        const durationInMinutes = totalMetrics.totalTypingDuration / 60000;
        
        totalMetrics.averageWPM = totalWordsTyped / durationInMinutes;
    }
    
    console.log("Final Behavioral Metrics (Corrected):", totalMetrics);
    return totalMetrics;
}
  
};

// Initialize the tracker when the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
    // Ensure this runs only on the application page
    if (document.getElementById('loan-application-form')) {
        behavioralDataTracker.initialize();
    }
});

// Expose a global function to be called from app.js
function getBehavioralMetrics() {
    return behavioralDataTracker.getMetrics();
}
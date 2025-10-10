const behavioralDataTracker = {
    fieldMetrics: {},
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
                this.resetFieldMetrics(fieldId);

                element.addEventListener('focus', () => this.handleFocus(fieldId));
                element.addEventListener('blur', () => this.handleBlur(fieldId));
                element.addEventListener('keydown', (e) => this.handleKeydown(fieldId, e));
            }
        });
    },

    // Sets up the initial data structure for a field
    resetFieldMetrics: function(fieldId) {
        this.fieldMetrics[fieldId] = {
            hesitationTime: null,
            duration: 0,          
            keypressCount: 0,
            correctionCount: 0,   
            startTime: null,      
            firstKeyTime: null,   
        };
    },

    // When a user clicks into a field
    handleFocus: function(fieldId) {
        const field = this.fieldMetrics[fieldId];
        if (!field.startTime) {
            field.startTime = performance.now();
        }
    },

    handleBlur: function(fieldId) {
        const field = this.fieldMetrics[fieldId];
        if (field.startTime && field.firstKeyTime) {
            field.duration = performance.now() - field.firstKeyTime;
        }
    },

    handleKeydown: function(fieldId, event) {
        const field = this.fieldMetrics[fieldId];
        if (!field.firstKeyTime) {
            field.firstKeyTime = performance.now();
            field.hesitationTime = field.firstKeyTime - field.startTime;
        }

        field.keypressCount++;
        if (event.key === 'Backspace' || event.key === 'Delete') {
            field.correctionCount++;
        }
    },

getMetrics: function() {
    const totalMetrics = {
        totalTypingDuration: 0,
        totalKeyPresses: 0,
        totalCorrections: 0,
        averageHesitationTime: 0,
        averageWPM: 0 
    };

    let totalHesitation = 0;
    let validFieldsForHesitation = 0;

    let totalCharactersTyped = 0;

    for (const fieldId in this.fieldMetrics) {
        const field = this.fieldMetrics[fieldId];
        const element = document.getElementById(fieldId);

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

    if (validFieldsForHesitation > 0) {
        totalMetrics.averageHesitationTime = totalHesitation / validFieldsForHesitation;
    }

    if (totalMetrics.totalTypingDuration > 0 && totalCharactersTyped > 0) {
        const totalWordsTyped = totalCharactersTyped / 5;
        const durationInMinutes = totalMetrics.totalTypingDuration / 60000;
        totalMetrics.averageWPM = totalWordsTyped / durationInMinutes;
    }
    
    console.log("Final Behavioral Metrics (Corrected):", totalMetrics);
    return totalMetrics;
}
  
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loan-application-form')) {
        behavioralDataTracker.initialize();
    }
});

function getBehavioralMetrics() {
    return behavioralDataTracker.getMetrics();

}
